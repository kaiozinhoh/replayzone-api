// models/userModel.js
import db from '../config/db.js';

export const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM usuario_app WHERE email = ?';
    db.query(query, [email], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};


export const deleteUserById = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM usuario_app WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

export const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, nome, email, telefone, senha FROM usuario_app WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

export const updateUserById = (id, nome, email, senha, telefone) => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (nome) {
      fields.push('nome = ?');
      values.push(nome);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (senha) {
      fields.push('senha = ?');
      values.push(senha);
    }
    if (telefone) {
      fields.push('telefone = ?');
      values.push(telefone);
    }

    values.push(id);
    const query = `UPDATE usuario_app SET ${fields.join(', ')} WHERE id = ?`;

    db.query(query, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

export const updatePasswordById = (id, novaSenhaHash) => {
  return new Promise((resolve, reject) => {

    const query = 'UPDATE usuario_app SET senha = ? WHERE id = ?';

    // Executa a query com db.query
    db.query(query, [novaSenhaHash, id], (err, result) => {
      if (err) {

        reject(err); // Rejeita a Promise em caso de erro
      } else {
  
        resolve(result); // Resolve a Promise com o resultado
      }
    });
  });
};


export const updatePasswordByEmail = (email, novaSenhaHash) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE usuario_app SET senha = ? WHERE email = ?';

    // Executa a query com db.query
    db.query(query, [novaSenhaHash, email], (err, result) => {
      if (err) {
        reject(err); // Rejeita a Promise em caso de erro
      } else {
        resolve(result); // Resolve a Promise com o resultado
      }
    });
  });
};

export const getUserByPhone = (telefone) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM usuario_app WHERE telefone = ?';
    db.query(query, [telefone], (err, results) => {
      if (err) reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

// Criar usuário sem senha
export const createUser = (nome, email, senha, telefone) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO usuario_app (nome, telefone) VALUES (?, ?)';
    db.query(query, [nome, telefone], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};