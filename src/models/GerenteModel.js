import db from '../config/db.js';

// Criar um novo usuário (com cargo padrão 1)
export const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO usuarios_admin (nome, email, password, cargo, quadra_id,) VALUES (?, ?, ?, ?, ?)';
    const values = [
      userData.nome,
      userData.email,
      userData.password,
      userData.quadra_id,
      userData.cargo
    ];
    
    db.query(query, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Buscar usuário por email (para verificar duplicidade)
export const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM usuarios_admin WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar usuários por quadra
export const getUsersByQuadra = (quadraId) => {
  return new Promise((resolve, reject) => {
  const query = 'SELECT id, nome, email, cargo, quadra_id FROM usuarios_admin WHERE quadra_id = ?';
    db.query(query, [quadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Atualizar usuário
export const updateUser = (id, userData) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE usuarios_admin SET nome = ?, email = ?, quadra_id = ? WHERE id = ?';
    const values = [
      userData.nome,
      userData.email,
      userData.quadra_id,
      id
    ];
    
    db.query(query, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Atualizar senha do usuário
export const updateUserPassword = (id, password) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE usuarios_admin SET password = ? WHERE id = ?';
    db.query(query, [password, id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Excluir usuário
export const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM usuarios_admin WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}; 