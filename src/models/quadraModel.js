// models/quadraModel.js
import db from '../config/db.js';

export const getQuadrasByUsuarioId = (usuarioId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *
      FROM quadras
      INNER JOIN usuario_quadras ON quadras.id = usuario_quadras.quadra_id
      WHERE usuario_quadras.usuario_id = ?
    `;
    db.query(query, [usuarioId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// models/quadraModel.js - Funções para controle de inadimplência

// Buscar quadras por cliente_id
export const getQuadrasByClienteId = (clienteId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM quadras WHERE cliente_id = ?';
    db.query(query, [clienteId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Marcar quadra como atrasada
export const marcarQuadraComoAtrasada = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE quadras SET atrasado = "sim" WHERE id = ?';
    db.query(query, [quadraId], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Marcar quadra como em dia
export const marcarQuadraComoEmDia = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE quadras SET atrasado = "nao" WHERE id = ?';
    db.query(query, [quadraId], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Buscar todas as quadras atrasadas
export const getQuadrasAtrasadas = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM quadras WHERE atrasado = "sim"';
    db.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Vincular cliente à quadra
export const vincularClienteAQuadra = (quadraId, clienteId) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE quadras SET cliente_id = ? WHERE id = ?';
    db.query(query, [clienteId, quadraId], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Obter horário de funcionamento por ID da quadra
export const getHorarioFuncionamentoByQuadraId = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM horario_funcionamento WHERE quadra_id = ? ORDER BY dia_semana';
    db.query(query, [quadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Atualizar horário de funcionamento
export const updateHorarioFuncionamento = (quadraId, horarios) => {
  return new Promise((resolve, reject) => {
    // Primeiro, deletar os horários existentes
    const deleteQuery = 'DELETE FROM horario_funcionamento WHERE quadra_id = ?';
    
    db.query(deleteQuery, [quadraId], (err) => {
      if (err) return reject(err);
      
      // Inserir os novos horários
      const insertQuery = 'INSERT INTO horario_funcionamento (quadra_id, dia_semana, hora_inicio, hora_fim) VALUES ?';
      const values = horarios.map(horario => [
        quadraId,
        horario.dia_semana,
        horario.hora_inicio,
        horario.hora_fim
      ]);
      
      db.query(insertQuery, [values], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  });
};

export const getQuadraByCodigo = (codigoQuadra) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id FROM quadras WHERE codigo_quadra = ?';
    db.query(query, [codigoQuadra], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

export const vincularUsuarioAQuadra = (usuarioId, quadraId) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO usuario_quadras (usuario_id, quadra_id) VALUES (?, ?)';
    db.query(query, [usuarioId, quadraId], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

export const desvincularUsuarioDeQuadra = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM usuario_quadras WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

export const verificarVinculoUsuarioQuadra = (usuarioId, quadraId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM usuario_quadras WHERE usuario_id = ? AND quadra_id = ?';
    db.query(query, [usuarioId,quadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar subquadras por quadra_id com cameraId e ativo
export const getSubQuadrasByQuadraIdAndCamera = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, nome, cameraId, ativo 
      FROM subquadras 
      WHERE quadra_id = ? AND ativo = 'sim' AND cameraId IS NOT NULL AND cameraId != ''
    `;
    db.query(query, [quadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Função para liberar conexão do pool
export const releaseConnection = (connection) => {
  if (connection && typeof connection.release === 'function') {
    connection.release();
  }
};

// Função para buscar subquadras por quadra_id
export const getSubQuadrasByQuadraId = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM subquadras WHERE quadra_id = ?';
    db.query(query, [quadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Função para buscar subquadra por ID
export const getSubQuadraById = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM subquadras WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Busca uma quadra pelo ID
export const getQuadraById = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM quadras WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar todas as quadras
export const getAllQuadras = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM quadras';
    db.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// models/quadraModel.js - Adicione estas funções para patrocinadores

// Obter patrocinadores por ID da quadra
export const getSponsorsByQuadraId = (quadraId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM sponsors WHERE quadra_id = ? ORDER BY created_at';
    db.query(query, [quadraId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Adicione esta função para obter a conexão
export const getConnection = () => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) reject(err);
      else resolve(connection);
    });
  });
};

// Atualizar patrocinadores
export const updateSponsors = (quadraId, sponsors) => {
  return new Promise((resolve, reject) => {
    // Primeiro, deletar os patrocinadores existentes
    const deleteQuery = 'DELETE FROM sponsors WHERE quadra_id = ?';
    
    db.query(deleteQuery, [quadraId], (err) => {
      if (err) return reject(err);
      
      if (sponsors.length === 0) {
        return resolve({ message: 'Nenhum patrocinador para inserir' });
      }
      
      // Inserir os novos patrocinadores
      const insertQuery = 'INSERT INTO sponsors (quadra_id, name, logo_url, website, position) VALUES ?';
      const values = sponsors.map(sponsor => [
        quadraId,
        sponsor.name,
        sponsor.logo_url,
        sponsor.website || '',
        sponsor.position || 'bottom'
      ]);
      
      db.query(insertQuery, [values], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  });
};


// Gerar slug único para a quadra
export const generateUniqueSlug = async (nome) => {
  return new Promise((resolve, reject) => {
    // Criar slug base
    let baseSlug = nome
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Verificar se o slug já existe
    const checkSlugQuery = 'SELECT id FROM quadras WHERE slug = ?';
    
    const checkSlug = (slug, counter = 0) => {
      const finalSlug = counter > 0 ? `${slug}-${counter}` : slug;
      
      db.query(checkSlugQuery, [finalSlug], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          resolve(finalSlug);
        } else {
          checkSlug(slug, counter + 1);
        }
      });
    };
    
    checkSlug(baseSlug);
  });
};

// Buscar quadra por slug
export const getQuadraBySlug = (slug) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM quadras WHERE slug = ?';
    db.query(query, [slug], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Atualizar o slug de uma quadra existente
export const updateQuadraSlug = (id, slug) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE quadras SET slug = ?, update_em = NOW() WHERE id = ?';
    db.query(query, [slug, id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Modifique a função createQuadra para incluir o slug
export const createQuadra = async (quadraData) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Gerar slug único
      const slug = await generateUniqueSlug(quadraData.nome);
      
      const query = 'INSERT INTO quadras (nome, endereco, cidade, estado, cep, telefone, url_image, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const values = [
        quadraData.nome,
        quadraData.endereco,
        quadraData.cidade,
        quadraData.estado,
        quadraData.cep,
        quadraData.telefone,
        quadraData.url_image,
        slug
      ];
      
      db.query(query, values, (err, result) => {
        if (err) reject(err);
        resolve({...result, slug});
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Modifique a função updateQuadra para atualizar o slug se o nome mudar
export const updateQuadra = async (id, { 
  nome, 
  endereco, 
  cidade, 
  estado, 
  cep, 
  telefone, 
  url_image,
  chavepix,
  valor_hora,
  tempoparamarcar,
  tempoparacancelar,
  fundo_url
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Verificar se o nome foi alterado
      const currentQuadra = await getQuadraById(id);
      
      let slug = currentQuadra[0]?.slug;
      
      // Se o nome mudou, gerar novo slug
      if (currentQuadra[0]?.nome !== nome) {
        slug = await generateUniqueSlug(nome);
      }
      
      const query = `
        UPDATE quadras 
        SET nome = ?, endereco = ?, cidade = ?, estado = ?, cep = ?, telefone = ?, 
            url_image = ?, chavepix = ?, valor_hora = ?, tempoparamarcar = ?, 
            tempoparacancelar = ?, fundo_url = ?, slug = ?, update_em = NOW()
        WHERE id = ?
      `;

      const values = [
        nome, endereco, cidade, estado, cep, telefone, url_image,
        chavepix, valor_hora, tempoparamarcar, tempoparacancelar,
        fundo_url, slug, id
      ];

      db.query(query, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    } catch (error) {
      reject(error);
    }
  });
};