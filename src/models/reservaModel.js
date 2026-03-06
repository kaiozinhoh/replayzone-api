// models/reservaModel.js
import db from '../config/db.js';

import dayjs from 'dayjs'; // Adicione esta linha

// models/reservaModel.js

// Buscar reservas fixas por quadra
export const getReservasFixasPorQuadra = (quadra_id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        rf.*,
        s.nome as subquadra_nome,
        q.nome as quadra_nome
      FROM reservas_fixas rf
      JOIN subquadras s ON rf.subquadra_id = s.id
      JOIN quadras q ON rf.quadra_id = q.id
      WHERE rf.quadra_id = ?
      ORDER BY rf.dia_semana, rf.hora_inicio
    `;
    db.query(query, [quadra_id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Criar reserva fixa
export const criarReservaFixa = (reservaFixaData) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO reservas_fixas 
        (quadra_id, subquadra_id, dia_semana, hora_inicio, hora_fim, cliente_nome, cliente_telefone, preco, status_pagamento) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      reservaFixaData.quadra_id,
      reservaFixaData.subquadra_id,
      reservaFixaData.dia_semana,
      reservaFixaData.hora_inicio,
      reservaFixaData.hora_fim,
      reservaFixaData.cliente_nome,
      reservaFixaData.cliente_telefone,
      reservaFixaData.preco,
      reservaFixaData.status_pagamento
    ];

    db.query(query, values, (err, result) => {
      if (err) reject(err);
      else resolve({ id: result.insertId, ...reservaFixaData });
    });
  });
};

// Excluir reserva fixa
export const excluirReservaFixa = (id) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM reservas_fixas WHERE id = ?`;
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Buscar reservas fixas de uma subquadra por dia da semana
export const getReservasFixasPorSubquadraEDia = (subquadra_id, dia_semana) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *
      FROM reservas_fixas
      WHERE subquadra_id = ?
        AND dia_semana = ?
    `;

    db.query(query, [subquadra_id, dia_semana], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};


// Verificar conflito de reserva fixa
export const verificarConflitoFixa = (subquadra_id, dia_semana, hora_inicio, hora_fim) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id
      FROM reservas_fixas
      WHERE subquadra_id = ?
        AND dia_semana = ?
        AND (
          (hora_inicio < ? AND hora_fim > ?) OR
          (hora_inicio >= ? AND hora_inicio < ?) OR
          (hora_fim > ? AND hora_fim <= ?)
        )
    `;
    
    db.query(query, [
      subquadra_id, dia_semana,
      hora_fim, hora_inicio,
      hora_inicio, hora_fim,
      hora_inicio, hora_fim
    ], (err, results) => {
      if (err) reject(err);
      else resolve(results.length > 0);
    });
  });
};

// Gerar reservas a partir das fixas para um período
export const gerarReservasFromFixas = (data_inicio, data_fim) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO reservas (quadra_id, subquadra_id, data, hora_inicio, hora_fim, cliente_nome, cliente_telefone, preco, status, status_pagamento, token, origem_fixa_id)
      SELECT 
        rf.quadra_id,
        rf.subquadra_id,
        dates.data,
        rf.hora_inicio,
        rf.hora_fim,
        rf.cliente_nome,
        rf.cliente_telefone,
        rf.preco,
        'confirmado' as status,
        rf.status_pagamento,
        CONCAT('fixa_', rf.id, '_', DATE_FORMAT(dates.data, '%Y%m%d')) as token,
        rf.id as origem_fixa_id
      FROM reservas_fixas rf
      CROSS JOIN (
        SELECT DATE_ADD(?, INTERVAL seq.seq DAY) as data
        FROM (
          SELECT a.N + b.N * 10 + c.N * 100 AS seq
          FROM 
            (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
            (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
            (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c
        ) seq
        WHERE DATE_ADD(?, INTERVAL seq.seq DAY) <= ?
      ) dates
      WHERE DAYOFWEEK(dates.data) = CASE rf.dia_semana
        WHEN 'segunda' THEN 2
        WHEN 'terça' THEN 3
        WHEN 'quarta' THEN 4
        WHEN 'quinta' THEN 5
        WHEN 'sexta' THEN 6
        WHEN 'sábado' THEN 7
        WHEN 'domingo' THEN 1
      END
      AND NOT EXISTS (
        SELECT 1 FROM reservas r 
        WHERE r.subquadra_id = rf.subquadra_id 
        AND r.data = dates.data 
        AND r.hora_inicio = rf.hora_inicio
      )
    `;
    
    db.query(query, [data_inicio, data_inicio, data_fim], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getReservasPorSubquadraEData = (subquadra_id, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT hora_inicio, hora_fim, status
      FROM reservas
      WHERE subquadra_id = ? 
        AND data = ?
        AND (status = 'pendente' OR status = 'confirmado')
    `;
    
    // Adicionar timeout
    const timeout = setTimeout(() => {
      reject(new Error('Timeout na consulta de reservas'));
    }, 10000); // 10 segundos

    db.query(query, [subquadra_id, data], (err, results) => {
      clearTimeout(timeout);
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// models/reservaModel.js

// Buscar reservas por quadra_id e data específica
export const getReservasPorQuadraEData = (quadra_id, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.*,
        s.nome as subquadra_nome,
        q.nome as quadra_nome
      FROM reservas r
      JOIN subquadras s ON r.subquadra_id = s.id
      JOIN quadras q ON r.quadra_id = q.id
      WHERE r.quadra_id = ?
        AND r.data = ?
      ORDER BY r.hora_inicio ASC
    `;
    db.query(query, [quadra_id, data], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Buscar horário de funcionamento de uma quadra pelo dia da semana
export const getHorarioFuncionamentoQuadra = (quadra_id, dia_semana) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT hora_inicio, hora_fim
      FROM horario_funcionamento
      WHERE quadra_id = ?
        AND dia_semana = ?
    `;
    db.query(query, [quadra_id, dia_semana], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
};
export const getSubquadrasPorQuadra = (quadra_id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT id, nome FROM subquadras WHERE quadra_id = ?`;
    db.query(query, [quadra_id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Corrigindo a função no reservaModel.js
export const getHorarioFuncionamentoQuadraPrincipal = (quadra_id, diaSemana) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT hora_inicio, hora_fim 
      FROM horario_funcionamento 
      WHERE quadra_id = ? 
        AND dia_semana = ?
    `;
    db.query(query, [quadra_id, diaSemana], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
};

export const cancelarReserva = (reservaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE reservas
      SET status = 'cancelado'
      WHERE id = ?
    `;
    db.query(query, [reservaId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// models/reservaModel.js

// Relatório diário
export const getRelatorioDiario = (quadra_id, subquadra_id, data) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        r.*,
        s.nome as subquadra_nome,
        q.nome as quadra_nome,
        COUNT(*) as total_reservas,
        SUM(CASE WHEN r.status = 'confirmado' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN r.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN r.status = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN r.status = 'recusado' THEN 1 ELSE 0 END) as recusadas,
        SUM(r.preco) as faturamento_total,
        SUM(CASE WHEN r.status = 'confirmado' THEN r.preco ELSE 0 END) as faturamento_confirmado
      FROM reservas r
      JOIN subquadras s ON r.subquadra_id = s.id
      JOIN quadras q ON r.quadra_id = q.id
      WHERE r.quadra_id = ? 
        AND r.data = ?
    `;
    
    const params = [quadra_id, data];
    
    if (subquadra_id) {
      query += ` AND r.subquadra_id = ?`;
      params.push(subquadra_id);
    }
    
    query += ` GROUP BY r.data ORDER BY r.data`;
    
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || {});
    });
  });
};

// Relatório semanal
export const getRelatorioSemanal = (quadra_id, subquadra_id, data_inicio) => {
  return new Promise((resolve, reject) => {
    const dataFim = dayjs(data_inicio).add(6, 'day').format('YYYY-MM-DD');
    
    let query = `
      SELECT 
        r.data,
        COUNT(*) as total_reservas,
        SUM(CASE WHEN r.status = 'confirmado' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN r.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN r.status = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN r.status = 'recusado' THEN 1 ELSE 0 END) as recusadas,
        SUM(r.preco) as faturamento_total,
        SUM(CASE WHEN r.status = 'confirmado' THEN r.preco ELSE 0 END) as faturamento_confirmado,
        DAYNAME(r.data) as dia_semana
      FROM reservas r
      WHERE r.quadra_id = ? 
        AND r.data BETWEEN ? AND ?
    `;
    
    const params = [quadra_id, data_inicio, dataFim];
    
    if (subquadra_id) {
      query += ` AND r.subquadra_id = ?`;
      params.push(subquadra_id);
    }
    
    query += ` GROUP BY r.data ORDER BY r.data`;
    
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Relatório quinzenal (15 dias)
export const getRelatorioQuinzenal = (quadra_id, subquadra_id, data_inicio) => {
  return new Promise((resolve, reject) => {
    const dataFim = dayjs(data_inicio).add(14, 'day').format('YYYY-MM-DD');
    
    let query = `
      SELECT 
        r.data,
        COUNT(*) as total_reservas,
        SUM(CASE WHEN r.status = 'confirmado' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN r.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN r.status = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN r.status = 'recusado' THEN 1 ELSE 0 END) as recusadas,
        SUM(r.preco) as faturamento_total,
        SUM(CASE WHEN r.status = 'confirmado' THEN r.preco ELSE 0 END) as faturamento_confirmado
      FROM reservas r
      WHERE r.quadra_id = ? 
        AND r.data BETWEEN ? AND ?
    `;
    
    const params = [quadra_id, data_inicio, dataFim];
    
    if (subquadra_id) {
      query += ` AND r.subquadra_id = ?`;
      params.push(subquadra_id);
    }
    
    query += ` GROUP BY r.data ORDER BY r.data`;
    
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Relatório mensal
export const getRelatorioMensal = (quadra_id, subquadra_id, ano, mes) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        r.data,
        COUNT(*) as total_reservas,
        SUM(CASE WHEN r.status = 'confirmado' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN r.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN r.status = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN r.status = 'recusado' THEN 1 ELSE 0 END) as recusadas,
        SUM(r.preco) as faturamento_total,
        SUM(CASE WHEN r.status = 'confirmado' THEN r.preco ELSE 0 END) as faturamento_confirmado,
        DAY(r.data) as dia
      FROM reservas r
      WHERE r.quadra_id = ? 
        AND YEAR(r.data) = ? 
        AND MONTH(r.data) = ?
    `;
    
    const params = [quadra_id, ano, mes];
    
    if (subquadra_id) {
      query += ` AND r.subquadra_id = ?`;
      params.push(subquadra_id);
    }
    
    query += ` GROUP BY r.data ORDER BY r.data`;
    
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Relatório anual
export const getRelatorioAnual = (quadra_id, subquadra_id, ano) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        MONTH(r.data) as mes,
        COUNT(*) as total_reservas,
        SUM(CASE WHEN r.status = 'confirmado' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN r.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN r.status = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN r.status = 'recusado' THEN 1 ELSE 0 END) as recusadas,
        SUM(r.preco) as faturamento_total,
        SUM(CASE WHEN r.status = 'confirmado' THEN r.preco ELSE 0 END) as faturamento_confirmado,
        MONTHNAME(r.data) as nome_mes
      FROM reservas r
      WHERE r.quadra_id = ? 
        AND YEAR(r.data) = ?
    `;
    
    const params = [quadra_id, ano];
    
    if (subquadra_id) {
      query += ` AND r.subquadra_id = ?`;
      params.push(subquadra_id);
    }
    
    query += ` GROUP BY MONTH(r.data) ORDER BY mes`;
    
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Relatório personalizado
export const getRelatorioPersonalizado = (quadra_id, subquadra_id, data_inicio, data_fim) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        r.data,
        COUNT(*) as total_reservas,
        SUM(CASE WHEN r.status = 'confirmado' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN r.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN r.status = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN r.status = 'recusado' THEN 1 ELSE 0 END) as recusadas,
        SUM(r.preco) as faturamento_total,
        SUM(CASE WHEN r.status = 'confirmado' THEN r.preco ELSE 0 END) as faturamento_confirmado
      FROM reservas r
      WHERE r.quadra_id = ? 
        AND r.data BETWEEN ? AND ?
    `;
    
    const params = [quadra_id, data_inicio, data_fim];
    
    if (subquadra_id) {
      query += ` AND r.subquadra_id = ?`;
      params.push(subquadra_id);
    }
    
    query += ` GROUP BY r.data ORDER BY r.data`;
    
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Estatísticas gerais
export const getEstatisticasReservas = (quadra_id, subquadra_id) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        COUNT(*) as total_reservas,
        SUM(CASE WHEN r.status = 'confirmado' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN r.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN r.status = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN r.status = 'recusado' THEN 1 ELSE 0 END) as recusadas,
        SUM(r.preco) as faturamento_total,
        SUM(CASE WHEN r.status = 'confirmado' THEN r.preco ELSE 0 END) as faturamento_confirmado,
        MIN(r.data) as primeira_reserva,
        MAX(r.data) as ultima_reserva,
        AVG(r.preco) as preco_medio
      FROM reservas r
      WHERE r.quadra_id = ?
    `;
    
    const params = [quadra_id];
    
    if (subquadra_id) {
      query += ` AND r.subquadra_id = ?`;
      params.push(subquadra_id);
    }
    
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || {});
    });
  });
};

export const recusarReserva = (reservaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE reservas
      SET status = 'recusado'
      WHERE id = ?
    `;
    db.query(query, [reservaId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const confirmarReserva = (reservaId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE reservas
      SET status = 'confirmado'
      WHERE id = ?
    `;
    db.query(query, [reservaId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// models/reservaModel.js

// Buscar todas as reservas por quadra_id com informações da subquadra (ORDENADO POR DATA MAIS RECENTE)
export const getReservasPorQuadra = (quadra_id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.*,
        s.nome as subquadra_nome,
        q.nome as quadra_nome
      FROM reservas r
      JOIN subquadras s ON r.subquadra_id = s.id
      JOIN quadras q ON r.quadra_id = q.id
      WHERE r.quadra_id = ?
      ORDER BY r.data DESC, r.hora_inicio DESC
    `;
    db.query(query, [quadra_id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Buscar reservas por telefone do cliente
export const getReservasPorTelefone = (cliente_telefone) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.*,
        q.nome as quadra_nome,
        s.nome as subquadra_nome
      FROM reservas r
      JOIN quadras q ON r.quadra_id = q.id
      JOIN subquadras s ON r.subquadra_id = s.id
      WHERE r.cliente_telefone = ?
      ORDER BY r.data DESC, r.hora_inicio DESC
    `;
    db.query(query, [cliente_telefone], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// models/reservaModel.js
export const getReservaCompletaPorToken = (token) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.id,
        r.subquadra_id,
        r.quadra_id,
        r.data,
        r.hora_inicio,
        r.hora_fim,
        r.cliente_nome,
        r.cliente_telefone,
        r.status_pagamento,
        r.token,
        r.preco,
        r.status,
        r.criado_em,
        q.nome AS quadra_nome,
        q.telefone AS quadra_telefone,
        q.webhook AS quadra_webhook,
        q.endereco AS quadra_endereco,
        sq.nome AS subquadra_nome
      FROM reservas r
      LEFT JOIN quadras q ON r.quadra_id = q.id
      LEFT JOIN subquadras sq ON r.subquadra_id = sq.id
      WHERE r.token = ?
    `;
    
    db.query(query, [token], (err, results) => {
      if (err) {
        console.error('Erro na query:', err);
        reject(err);
      } else {
        console.log('Resultados encontrados:', results); // Log para debug
        resolve(results[0] || null);
      }
    });
  });
};

export const getReservaPorToken = (token) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.*,
        r.cliente_telefone AS reserva_telefone,
        q.nome AS quadra_nome,
        q.telefone AS quadra_telefone,
        q.webhook AS quadra_webhook,
        q.slug AS quadra_slug,
        sq.nome AS subquadra_nome
      FROM reservas r
      JOIN quadras q ON r.quadra_id = q.id
      JOIN subquadras sq ON r.subquadra_id = sq.id
      WHERE r.token = ?
    `;
    
    db.query(query, [token], (err, results) => {
      if (err) {
        console.error('Erro na query:', err);
        reject(err);
      } else {
        resolve(results[0] || null);
      }
    });
  });
};
// Criar nova reserva
export const criarReserva = (reservaData) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO reservas 
        (quadra_id, subquadra_id, data, hora_inicio, hora_fim, cliente_nome, cliente_telefone, cliente_cpf, preco, status, status_pagamento, token) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      reservaData.quadra_id,
      reservaData.subquadra_id,
      reservaData.data,
      reservaData.hora_inicio,
      reservaData.hora_fim,
      reservaData.cliente_nome,
      reservaData.cliente_telefone,
      reservaData.cliente_cpf,
      reservaData.preco,
      reservaData.status,
      reservaData.status_pagamento,
      reservaData.token
    ];

    db.query(query, values, (err, result) => {
      if (err) reject(err);
      else resolve({ id: result.insertId, ...reservaData });
    });
  });
};

// models/reservaModel.js

// Buscar reservas pendentes a partir de um horário específico
export const getReservasPendentesAPartirDe = (quadra_id, data, hora) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.*,
        s.nome as subquadra_nome,
        q.nome as quadra_nome
      FROM reservas r
      JOIN subquadras s ON r.subquadra_id = s.id
      JOIN quadras q ON r.quadra_id = q.id
      WHERE r.quadra_id = ?
        AND r.data = ?
        AND r.status = 'pendente'
        AND r.hora_inicio >= ?
      ORDER BY r.hora_inicio ASC
    `;
    db.query(query, [quadra_id, data, hora], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};
// Verificar conflito de reserva com suporte a horários quebrados
export const verificarConflito = (subquadra_id, data, hora_inicio, hora_fim) => {
  return new Promise((resolve, reject) => {
    // Converter horários para minutos para comparação precisa
    const [inicioH, inicioM] = hora_inicio.split(':').map(Number);
    const [fimH, fimM] = hora_fim.split(':').map(Number);
    
    const inicioMinutos = inicioH * 60 + inicioM;
    const fimMinutos = fimH * 60 + fimM;

    const query = `
      SELECT id, hora_inicio, hora_fim
      FROM reservas
      WHERE subquadra_id = ?
        AND data = ?
        AND status != 'cancelado'
        AND status != 'recusado'
    `;
    
    db.query(query, [subquadra_id, data], (err, results) => {
      if (err) reject(err);
      
      const conflito = results.some(reserva => {
        const [reservaInicioH, reservaInicioM] = reserva.hora_inicio.split(':').map(Number);
        const [reservaFimH, reservaFimM] = reserva.hora_fim.split(':').map(Number);
        
        const reservaInicioMinutos = reservaInicioH * 60 + reservaInicioM;
        const reservaFimMinutos = reservaFimH * 60 + reservaFimM;
        
        // Verificar sobreposição de intervalos
        return (
          (inicioMinutos < reservaFimMinutos && fimMinutos > reservaInicioMinutos)
        );
      });
      
      resolve(conflito);
    });
  });
};
