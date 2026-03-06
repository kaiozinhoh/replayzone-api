import bcrypt from 'bcrypt';
import * as userModel from '../models/userModel.js';
import jwt from '../token.js';  // Supondo que a função CreateJWT está no seu arquivo de token

// Rota de login
export const loginUser = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const results = await userModel.getUserByEmail(email);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Email não encontrado.' });
    }

    const usuario = results[0];

    // Comparando a senha fornecida com a senha criptografada armazenada no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    // Gerar o token JWT após a autenticação bem-sucedida
    const token = jwt.CreateJWT(usuario.id);

    res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        token: token,
      telefone: usuario.telefone
      });
  } catch (error) {
    console.error('Erro ao buscar o usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar o usuário.' });
  }
};

// Rota para criar um novo usuário
export const createUser = async (req, res) => {
  const { nome, email, senha, telefone } = req.body;

  if (!nome || !email || !senha || !telefone) {
    return res.status(400).json({ message: 'Nome, e-mail, senha e telefone são obrigatórios.' });
  }

  try {
    // Criptografar a senha antes de salvar
    const saltRounds = 10; // Número de rounds para o salting
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // Salvar o novo usuário com a senha criptografada
    await userModel.createUser(nome, email, senhaHash, telefone);

    res.status(201).json({ message: 'Usuário criado com sucesso.' });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário.' });
  }
};

// Rota para excluir um usuário pelo ID
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
  }

  try {
    const result = await userModel.deleteUserById(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro ao excluir usuário.' });
  }
};

// Rota para obter os dados de um usuário pelo ID
export const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
  }

  try {
    const results = await userModel.getUserById(id);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário.' });
  }
};

// Rota para atualizar os dados de um usuário pelo ID
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, telefone } = req.body;

  if (!id || (!nome && email && senha && !telefone)) {
    return res.status(400).json({ message: 'ID do usuário e ao menos um campo para atualização são obrigatórios.' });
  }

  try {
    const result = await userModel.updateUserById(id, nome, email, senha, telefone);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
};

export const changePassword = async (req, res) => {
  const { id } = req.params; // ID do usuário
  const { senhaAntiga, novaSenha } = req.body;

  // Verificação inicial dos parâmetros
  if (!id || !senhaAntiga || !novaSenha) {
    console.log('Parâmetros ausentes:', { id, senhaAntiga, novaSenha });
    return res
      .status(400)
      .json({ message: 'ID, senha antiga e nova senha são obrigatórios.' });
  }

  try {
    // Obter dados do usuário pelo ID
    const results = await userModel.getUserById(id);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const usuario = results[0];

    // Verificar se a senha antiga está correta
    const senhaValida = await bcrypt.compare(senhaAntiga, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Senha antiga incorreta.' });
    }

    const saltRounds = 10;
    const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

    // Atualizar a senha no banco de dados
    const result = await userModel.updatePasswordById(id, novaSenhaHash);

    // Verificar o valor retornado por affectedRows
    if (result.affectedRows === 0 && usuario.senha === novaSenhaHash) {
      return res.status(200).json({ message: 'Senha alterada com sucesso.' });
    } else if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Erro ao atualizar a senha.' });
    }

    // Sucesso na alteração
    res.status(200).json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno ao alterar a senha.' });
  }
};

export const changePasswordByEmail = async (req, res) => {
  const { email } = req.params; // Email do usuário
  const { novaSenha } = req.body;

  // Verificação inicial dos parâmetros
  if (!email || !novaSenha) {
    console.log('Parâmetros ausentes:', { email, novaSenha });
    return res
      .status(400)
      .json({ message: 'Email e nova senha são obrigatórios.' });
  }

  try {
    // Obter dados do usuário pelo email
    const results = await userModel.getUserByEmail(email);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const saltRounds = 10;
    const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

    // Atualizar a senha no banco de dados
    const result = await userModel.updatePasswordByEmail(email, novaSenhaHash);

    // Verificar o valor retornado por affectedRows
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Erro ao atualizar a senha.' });
    }

    // Sucesso na alteração
    res.status(200).json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar a senha:', error);
    res.status(500).json({ message: 'Erro interno ao alterar a senha.' });
  }
};


