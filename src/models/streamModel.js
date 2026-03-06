// models/streamModel.js - Versão ajustada
import db from '../config/db.js';

// Criar usuário de streaming
export const createStreamUser = (nome, telefone = null, email = null) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO users_stream (nome, telefone, email) VALUES (?, ?, ?)',
      [nome, telefone, email],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

// Buscar usuário de streaming por telefone
export const getStreamUserByPhone = (telefone) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM users_stream WHERE telefone = ?',
      [telefone],
      (err, results) => {
        if (err) reject(err);
        resolve(results.length > 0 ? results[0] : null);
      }
    );
  });
};

// Buscar usuário de streaming por ID
export const getStreamUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM users_stream WHERE id = ?',
      [id],
      (err, results) => {
        if (err) reject(err);
        resolve(results.length > 0 ? results[0] : null);
      }
    );
  });
};

// YouTube Stream Functions
export const saveYouTubeCredentials = (userId, accessToken, refreshToken, channelId, channelName, expiresAt) => {
  return new Promise((resolve, reject) => {
    // Primeiro verifica se já existe
    db.query(
      'SELECT id FROM youtube_streams WHERE user_id = ?',
      [userId],
      (err, results) => {
        if (err) return reject(err);
        
        if (results.length > 0) {
          // Atualiza existente
          db.query(
            `UPDATE youtube_streams SET 
             access_token = ?, refresh_token = ?, channel_id = ?, channel_name = ?, expires_at = ?, updated_at = NOW()
             WHERE user_id = ?`,
            [accessToken, refreshToken, channelId, channelName, expiresAt, userId],
            (err, result) => {
              if (err) reject(err);
              resolve(result);
            }
          );
        } else {
          // Insere novo
          db.query(
            `INSERT INTO youtube_streams 
             (user_id, access_token, refresh_token, channel_id, channel_name, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, accessToken, refreshToken, channelId, channelName, expiresAt],
            (err, result) => {
              if (err) reject(err);
              resolve(result);
            }
          );
        }
      }
    );
  });
};

export const getYouTubeCredentials = (userId) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM youtube_streams WHERE user_id = ?',
      [userId],
      (err, results) => {
        if (err) reject(err);
        resolve(results.length > 0 ? results[0] : null);
      }
    );
  });
};

export const updateYouTubeStreamStatus = (userId, isLive, streamKey = null, streamUrl = null) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE youtube_streams SET is_live = ?, updated_at = NOW()';
    const params = [isLive];
    
    if (streamKey) {
      query += ', stream_key = ?';
      params.push(streamKey);
    }
    if (streamUrl) {
      query += ', stream_url = ?';
      params.push(streamUrl);
    }
    
    query += ' WHERE user_id = ?';
    params.push(userId);
    
    db.query(query, params, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Instagram Stream Functions
export const saveInstagramCredentials = (userId, accessToken, igUserId, username) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT id FROM instagram_streams WHERE user_id = ?',
      [userId],
      (err, results) => {
        if (err) return reject(err);
        
        if (results.length > 0) {
          db.query(
            `UPDATE instagram_streams SET 
             access_token = ?, ig_user_id = ?, username = ?, updated_at = NOW()
             WHERE user_id = ?`,
            [accessToken, igUserId, username, userId],
            (err, result) => {
              if (err) reject(err);
              resolve(result);
            }
          );
        } else {
          db.query(
            `INSERT INTO instagram_streams 
             (user_id, access_token, ig_user_id, username) 
             VALUES (?, ?, ?, ?)`,
            [userId, accessToken, igUserId, username],
            (err, result) => {
              if (err) reject(err);
              resolve(result);
            }
          );
        }
      }
    );
  });
};

export const getInstagramCredentials = (userId) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM instagram_streams WHERE user_id = ?',
      [userId],
      (err, results) => {
        if (err) reject(err);
        resolve(results.length > 0 ? results[0] : null);
      }
    );
  });
};

export const updateInstagramStreamStatus = (userId, isLive, streamUrl = null) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE instagram_streams SET is_live = ?, updated_at = NOW()';
    const params = [isLive];
    
    if (streamUrl) {
      query += ', stream_url = ?';
      params.push(streamUrl);
    }
    
    query += ' WHERE user_id = ?';
    params.push(userId);
    
    db.query(query, params, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Stream History Functions
export const addStreamToHistory = (userId, platform, title, description, startTime, streamUrl = null) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO stream_history 
       (user_id, platform, title, description, start_time, stream_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, platform, title, description, startTime, streamUrl],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

export const updateStreamHistory = (streamId, endTime, viewerCount, status) => {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE stream_history 
       SET end_time = ?, viewer_count = ?, status = ?
       WHERE id = ?`,
      [endTime, viewerCount, status, streamId],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

export const getStreamHistory = (userId, limit = 10) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM stream_history 
       WHERE user_id = ? 
       ORDER BY start_time DESC 
       LIMIT ?`,
      [userId, limit],
      (err, results) => {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
};