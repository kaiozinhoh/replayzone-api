// controllers/gerenteController.js
import * as gerenteModel from '../models/GerenteModel.js';
import bcrypt from 'bcrypt';

// Criar um novo usuário
export const createUser = async (req, res) => {
  const { nome, email, password, quadra_id , cargo} = req.body;

  // Validação dos campos obrigatórios
  if (!nome || !email || !password || !quadra_id || !cargo) {
    return res.status(400).json({ 
      message: 'Nome, email, senha e ID da quadra são obrigatórios.',
      missing_fields: {
        nome: !nome,
        email: !email,
        password: !password,
        quadra_id: !quadra_id,
        cargo: !cargo
      }
    });
  }

  try {
    // Verificar se o email já está em uso
    const existingUser = await gerenteModel.getUserByEmail(email);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Este email já está em uso.' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await gerenteModel.createUser({
      nome,
      email,
      password: hashedPassword,
      quadra_id,
      cargo
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário.' });
  }
};

// Buscar usuários por quadra
export const getUsersByQuadra = async (req, res) => {
  const { quadra_id } = req.params;

  if (!quadra_id) {
    return res.status(400).json({ message: 'ID da quadra é obrigatório.' });
  }

  try {
    const users = await gerenteModel.getUsersByQuadra(quadra_id);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Nenhum usuário encontrado para esta quadra.' });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
};

// Atualizar usuário
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nome, email, quadra_id, password } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
  }

  // Validação dos campos obrigatórios para atualização
  if (!nome || !email || !quadra_id) {
    return res.status(400).json({ 
      message: 'Nome, email e ID da quadra são obrigatórios.',
      missing_fields: {
        nome: !nome,
        email: !email,
        quadra_id: !quadra_id
      }
    });
  }

  try {
    // Verificar se o email já está em uso por outro usuário
    const existingUser = await gerenteModel.getUserByEmail(email);
    if (existingUser.length > 0 && existingUser[0].id !== parseInt(id)) {
      return res.status(400).json({ message: 'Este email já está em uso por outro usuário.' });
    }

    // Atualizar informações básicas do usuário
    await gerenteModel.updateUser(id, {
      nome,
      email,
      quadra_id
    });

    // Se uma nova senha foi fornecida, atualizá-la
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await gerenteModel.updateUserPassword(id, hashedPassword);
    }

    res.status(200).json({
      message: 'Usuário atualizado com sucesso.',
      id: id
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
};

// Excluir usuário
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
  }

  try {
    const result = await gerenteModel.deleteUser(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro ao excluir usuário.' });
  }
}; 