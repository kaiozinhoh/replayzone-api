// models/authModel.js
import db from '../config/db.js';

// Salvar código de verificação (expira em 10 minutos)
export const saveVerificationCode = (userId, telefone, code) => {
  return new Promise((resolve, reject) => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    // Limpar códigos anteriores
    db.query(
      'DELETE FROM verification_codes WHERE user_id = ? AND telefone = ?',
      [userId, telefone],
      (err) => {
        if (err) return reject(err);
        
        // Inserir novo código
        db.query(
          'INSERT INTO verification_codes (user_id, telefone, code, expires_at) VALUES (?, ?, ?, ?)',
          [userId, telefone, code, expiresAt],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        );
      }
    );
  });
};

// Verificar código
export const verifyCode = (userId, telefone, code) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM verification_codes 
      WHERE user_id = ? AND telefone = ? AND code = ? AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;
    
    db.query(query, [userId, telefone, code], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};