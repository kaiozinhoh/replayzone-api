// controller/adminController.js
import bcrypt from 'bcrypt';
import * as adminModel from '../models/adminModel.js';
import jwt from '../token.js';

export const createAdmin = async (req, res) => {
  const { nome, email, password, telefone } = req.body;

  // Validação robusta
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ 
      message: 'Senha inválida ou não fornecida',
      errorCode: 'INVALID_PASSWORD'
    });
  }

  try {
    // Verifique se todos os campos necessários existem
    if (!nome || !email || !telefone) {
      return res.status(400).json({
        message: 'Todos os campos são obrigatórios',
        requiredFields: ['nome', 'email', 'password', 'telefone']
      });
    }

    // Verifique comprimento mínimo da senha
    if (password.length < 8) {
      return res.status(400).json({
        message: 'A senha deve ter pelo menos 8 caracteres'
      });
    }

    // Verificar se o email já existe
    console.log('Verificando se email já existe:', email);
    const existingAdmins = await adminModel.getAdminByEmail(email);
    
    if (existingAdmins.length > 0) {
      console.log('Email já cadastrado:', email);
      return res.status(409).json({
        success: false,
        message: 'Este email já está cadastrado no sistema',
        errorCode: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Gere o hash com tratamento de erro
    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } catch (hashError) {
      console.error('Erro ao gerar hash:', hashError);
      return res.status(500).json({
        message: 'Erro ao processar senha',
        error: hashError.message
      });
    }

    // Crie o admin no banco de dados
    await adminModel.createAdmin({
      nome,
      email,
      password: hashedPassword,
      telefone,
      cargo: 3
    });

    return res.status(201).json({
      success: true,
      message: 'Administrador criado com sucesso (pendente de aprovação)'
    });

  } catch (error) {
    console.error('Erro completo:', error);
    return res.status(500).json({
      message: 'Erro interno no servidor',
      errorDetails: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
    }

    console.log('Tentativa de login para:', email); // DEBUG

    const results = await adminModel.getAdminByEmail(email);
    
    if (results.length === 0) {
      console.log('Admin não encontrado:', email); // DEBUG
      return res.status(404).json({ message: 'Admin não encontrado.' });
    }

    const admin = results[0];
    console.log('Admin encontrado:', admin.id); // DEBUG
    console.log('Senha hash no BD:', admin.password); // DEBUG
    console.log('Senha fornecida:', password); // DEBUG

    // Verificação especial para debug
    if (admin.password === password) {
      console.log('AVISO: Senha não está hasheada no BD!');
    }

    const senhaValida = await bcrypt.compare(password, admin.password);
    console.log('Resultado bcrypt.compare:', senhaValida); // DEBUG

    if (!senhaValida) {
      // Verifica se a senha está em texto plano (para migração)
      if (admin.password === password) {
        console.log('Senha em texto plano detectada - rehashing...');
        // Re-hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await adminModel.updateAdminPassword(admin.id, hashedPassword);
        
        const token = jwt.CreateJWT(admin.id);
        return res.status(200).json({
          token: token,
          user: {
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            telefone: admin.telefone,
            cargo: admin.cargo
          }
        });
      }
      
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    const token = jwt.CreateJWT(admin.id);
    res.status(200).json({
      token: token,
      user: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        telefone: admin.telefone,
        cargo: admin.cargo,
        quadra_id: admin.quadra_id
      }
    });
    
  } catch (error) {
    console.error('Erro detalhado no login:', error);
    res.status(500).json({ 
      message: 'Erro interno no servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Função de recuperação de password
export const forgotAdminPassword = async (req, res) => {
  const { email, novapassword } = req.body;

  try {
    // Verifica se o admin existe
    const results = await adminModel.getAdminByEmail(email);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Admin não encontrado.' });
    }

    // Criptografa a nova password
    const saltRounds = 10;
    const novapasswordHash = await bcrypt.hash(novapassword, saltRounds);

    // Atualiza no banco
    await adminModel.updateAdminPasswordByEmail(email, novapasswordHash);

    res.status(200).json({ message: 'password atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao recuperar password:', error);
    res.status(500).json({ message: 'Erro ao atualizar a password.' });
  }
};

// NOVAS FUNÇÕES ADICIONADAS:

// Listar todos os usuários/admin
export const getAllAdmins = async (req, res) => {
  try {
    const results = await adminModel.getAllAdmins();
    res.status(200).json(results);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ 
      message: 'Erro interno ao buscar usuários',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obter usuário por ID
export const getAdminById = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await adminModel.getAdminById(id);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      message: 'Erro interno ao buscar usuário',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Atualizar dados do usuário (incluindo cargo)
export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { nome, email, cargo, telefone, quadra_id } = req.body;

  try {
    // Verificar se o usuário existe
    const userExists = await adminModel.getAdminById(id);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Verificar se o email já existe em outro usuário
    if (email && email !== userExists[0].email) {
      const existingAdmins = await adminModel.getAdminByEmail(email);
      if (existingAdmins.length > 0 && existingAdmins[0].id !== parseInt(id)) {
        return res.status(409).json({
          message: 'Este email já está cadastrado por outro usuário',
          errorCode: 'EMAIL_ALREADY_EXISTS'
        });
      }
    }

    const result = await adminModel.updateAdmin(id, { nome, email, telefone, cargo, quadra_id });

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Nenhuma alteração realizada.' });
    }

    res.status(200).json({ 
      message: 'Usuário atualizado com sucesso.',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      message: 'Erro interno ao atualizar usuário',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Atualizar apenas o cargo do usuário
export const updateAdminCargo = async (req, res) => {
  const { id } = req.params;
  const { cargo } = req.body;

  try {
    // Verificar se o usuário existe
    const userExists = await adminModel.getAdminById(id);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Validar cargo (1, 2 ou 3)
    if (![1, 2, 3].includes(cargo)) {
      return res.status(400).json({ message: 'Cargo inválido. Use 1 (Admin), 2 (Gestor) ou 3 (Pendente).' });
    }

    const result = await adminModel.updateAdminCargo(id, cargo);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Nenhuma alteração realizada.' });
    }

    res.status(200).json({ 
      message: 'Cargo atualizado com sucesso.',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({ 
      message: 'Erro interno ao atualizar cargo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Excluir usuário
export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se o usuário existe
    const userExists = await adminModel.getAdminById(id);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const result = await adminModel.deleteAdmin(id);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Nenhum usuário excluído.' });
    }

    res.status(200).json({ 
      message: 'Usuário excluído com sucesso.',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ 
      message: 'Erro interno ao excluir usuário',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Atualizar senha do usuário (por admin)
export const updateAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { novaSenha } = req.body;

  try {
    // Verificar se o usuário existe
    const userExists = await adminModel.getAdminById(id);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Criptografar a nova senha
    const saltRounds = 10;
    const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

    const result = await adminModel.updateAdminPassword(id, novaSenhaHash);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Nenhuma alteração realizada.' });
    }

    res.status(200).json({ 
      message: 'Senha atualizada com sucesso.',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ 
      message: 'Erro interno ao atualizar senha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};