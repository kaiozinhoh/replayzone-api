// models/videoModel.js
import db from '../config/db.js';

// Função para obter vídeos por subquadra_id, data, e tipo
export const getVideosBySubquadraDateType = (subquadra_id, start_time, end_time, tipo) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, caminho_video, criado_em, tipo
      FROM videos_subquadra
      WHERE subquadra_id = ? 
        AND criado_em BETWEEN ? AND ? 
        AND tipo = ?
    `;
    db.query(query, [subquadra_id, start_time, end_time, tipo], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Função para obter um vídeo pelo ID
export const getVideoById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT subquadra_id, id, caminho_video, criado_em, tipo, id_camera
      FROM videos_subquadra
      WHERE id = ?
    `;
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Função para obter vídeos de uma subquadra dentro de um intervalo de uma hora
export const getVideosByHourInterval = (subquadra_id, start_time, end_time) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, subquadra_id, id_quadra_videos, caminho_video, criado_em, tipo, id_camera
      FROM videos_subquadra
      WHERE subquadra_id = ? AND criado_em BETWEEN ? AND ?
    `;
    db.query(query, [subquadra_id, start_time, end_time], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Função para obter vídeos agrupados por group_code
export const getGroupedVideos = (subquadra_id, date, hour) => {
  return new Promise((resolve, reject) => {
    const start_time = `${date} ${hour}:00:00`;
    const end_time = `${date} ${hour}:59:59`;
    
    const query = `
      SELECT 
        vs.*,
        CASE 
          WHEN vs.group_code IS NOT NULL THEN 
            (SELECT COUNT(*) FROM videos_subquadra vs2 
             WHERE vs2.group_code = vs.group_code AND vs2.subquadra_id = vs.subquadra_id)
          ELSE 1
        END as video_count,
        vs.group_code
      FROM videos_subquadra vs
      WHERE vs.subquadra_id = ? 
        AND vs.criado_em BETWEEN ? AND ?
      ORDER BY 
        CASE 
          WHEN vs.group_code IS NOT NULL THEN vs.group_code 
          ELSE vs.id 
        END,
        vs.id_camera
    `;
    
    db.query(query, [subquadra_id, start_time, end_time], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Função para obter vídeos agrupados por data (para contagem)
export const getGroupedVideosByDate = (subquadra_id, date) => {
  return new Promise((resolve, reject) => {
    const start_time = `${date} 00:00:00`;
    const end_time = `${date} 23:59:59`;
    
    const query = `
      SELECT 
        vs.*,
        CASE 
          WHEN vs.group_code IS NOT NULL THEN 
            (SELECT COUNT(*) FROM videos_subquadra vs2 
             WHERE vs2.group_code = vs.group_code AND vs2.subquadra_id = vs.subquadra_id)
          ELSE 1
        END as video_count,
        vs.group_code
      FROM videos_subquadra vs
      WHERE vs.subquadra_id = ? 
        AND vs.criado_em BETWEEN ? AND ?
      ORDER BY vs.criado_em
    `;
    
    db.query(query, [subquadra_id, start_time, end_time], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Função auxiliar para agrupar vídeos pelo group_code
export const groupVideos = (videos) => {
  const grouped = {};
  
  videos.forEach(video => {
    const key = video.group_code || `single_${video.id}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        groupCode: video.group_code,
        videos: [],
        videoCount: video.video_count,
        createdAt: video.criado_em
      };
    }
    
    grouped[key].videos.push(video);
  });
  
  return Object.values(grouped);
};