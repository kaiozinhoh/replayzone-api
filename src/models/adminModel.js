// models/adminModel.js
import db from '../config/db.js';

export const createAdmin = ({ nome, email, password, telefone, cargo }) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO usuario_admin 
      (nome, email, password, telefone, cargo) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(query, 
      [nome, email, password, telefone, cargo],
      (err, result) => {
        if (err) {
          console.error('Erro na query:', err);
          return reject(err);
        }
        resolve(result);
      }
    );
  });
};

export const getAdminByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id, 
        nome, 
        email, 
        password, 
        cargo,
        telefone, 
        quadra_id 
      FROM usuario_admin 
      WHERE email = ?
    `;
    
    db.query(query, [email], (err, results) => {
      if (err) {
        console.error('Erro ao buscar admin por email:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
// NOVAS FUNÇÕES ADICIONADAS:

// Buscar todos os usuários/admin
export const getAllAdmins = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id, 
        nome, 
        email, 
        telefone, 
        cargo,
        data_cadastro,
        ultimo_acesso,
        quadra_id
      FROM usuario_admin 
      ORDER BY nome ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Erro ao buscar todos os admins:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Buscar usuário por ID
export const getAdminById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id, 
        nome, 
        email, 
        telefone, 
        cargo,
        data_cadastro,
        ultimo_acesso,
        quadra_id
      FROM usuario_admin 
      WHERE id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Erro ao buscar admin por ID:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// models/adminModel.js
export const getAdminsByQuadraId = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id, 
        nome, 
        email, 
        telefone, 
        cargo,
        quadra_id 
      FROM usuario_admin 
      WHERE quadra_id = ? AND cargo IN (1, 2)
    `;
    
    db.query(query, [quadraId], (err, results) => {
      if (err) {
        console.error('Erro ao buscar administradores por quadra:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Atualizar dados do usuário
export const updateAdmin = (id, { nome, email, telefone, cargo, quadra_id }) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE usuario_admin 
      SET nome = ?, email = ?, telefone = ?, cargo = ?, quadra_id = ?
      WHERE id = ?
    `;
    
    db.query(query, [ nome, email, telefone, cargo, quadra_id, id], (err, result) => {
      if (err) {
        console.error('Erro ao atualizar admin:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Atualizar apenas o cargo do usuário
export const updateAdminCargo = (id, cargo) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE usuario_admin SET cargo = ? WHERE id = ?';
    
    db.query(query, [cargo, id], (err, result) => {
      if (err) {
        console.error('Erro ao atualizar cargo:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Excluir usuário
export const deleteAdmin = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM usuario_admin WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Erro ao excluir admin:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Atualizar senha do usuário
export const updateAdminPassword = (id, passwordHash) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE usuario_admin SET password = ? WHERE id = ?';
    
    db.query(query, [passwordHash, id], (err, result) => {
      if (err) {
        console.error('Erro ao atualizar senha:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Atualizar senha do admin (função existente renomeada para consistência)
export const updateAdminPasswordByEmail = (email, passwordHash) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE usuario_admin SET password = ? WHERE email = ?';
    db.query(query, [passwordHash, email], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};