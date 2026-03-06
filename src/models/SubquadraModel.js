// models/subquadraModel.js
import db from '../config/db.js';

// Busca as subquadras associadas a uma quadra
export const getSubquadrasByQuadraId = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM subquadras WHERE quadra_id = ?';
    db.query(query, [quadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};
// Buscar todas as subquadras
export const getAllSubQuadras = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM subquadras';
    db.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};
// Busca uma subquadra pelo ID
export const getSubquadraById = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM subquadras WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Cria uma nova subquadra
export const createSubquadra = (subquadraData) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO subquadras (nome, quadra_id, tipo) VALUES (?, ?, ?)';
    const values = [subquadraData.nome, subquadraData.quadra_id, subquadraData.tipo];
    
    db.query(query, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Atualiza uma subquadra existente
export const updateSubquadra = (id, subquadraData) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE subquadras SET nome = ?, quadra_id = ?, tipo = ? WHERE id = ?';
    const values = [subquadraData.nome, subquadraData.quadra_id, subquadraData.tipo, id];
    
    db.query(query, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Buscar todos os vídeos de uma subquadra
export const getVideosBySubquadraId = (subquadraId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT v.*
      FROM videos_subquadra v
      WHERE v.subquadra_id = ?
      ORDER BY v.criado_em DESC
    `;
    db.query(query, [subquadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar todas as subquadras de uma quadra com contagem de vídeos
export const getSubquadrasWithVideoCount = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT s.*, 
             COUNT(v.id) as total_videos,
             MAX(v.criado_em) as ultimo_video
      FROM subquadras s
      LEFT JOIN videos_subquadra v ON s.id = v.subquadra_id
      WHERE s.quadra_id = ?
      GROUP BY s.id
      ORDER BY s.nome
    `;
    db.query(query, [quadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};
