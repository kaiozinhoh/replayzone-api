import db from '../config/db.js';
import * as quadraModel from './quadraModel.js';

// Buscar clientes com status de bloqueio para n8n (COM NOME DA QUADRA)
export const getClientesComStatusBloqueio = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.id,
        c.nome,
        c.email,
        c.telefone,
        c.cpf_cnpj,
        c.status_pagamento,
        c.vencimento_dia,
        c.ultimo_pagamento,
        c.dias_para_bloqueio,
        c.link_ultima_cobranca,
        c.plano_valor,
        c.bloqueado,
        c.quadra_id,
        q.nome as quadra_nome,  -- ✅ NOVO: Nome da quadra
        -- Campos calculados para n8n
        CASE 
          WHEN c.bloqueado = 'sim' THEN 'bloqueado'
          WHEN c.dias_para_bloqueio = 0 THEN 'bloqueio_hoje'
          WHEN c.dias_para_bloqueio = 1 THEN 'bloqueio_amanha' 
          WHEN c.dias_para_bloqueio BETWEEN 2 AND 5 THEN 'bloqueio_em_breve'
          ELSE 'regular'
        END as status_bloqueio_n8n,
        CASE 
          WHEN c.bloqueado = 'sim' THEN 'Seu sistema de replays está BLOQUEADO. Entre em contato para regularizar.'
          WHEN c.dias_para_bloqueio = 0 THEN 'ATENÇÃO: Seu sistema de replays será BLOQUEADO HOJE!'
          WHEN c.dias_para_bloqueio = 1 THEN 'ALERTA: Seu sistema de replays será bloqueado AMANHÃ!'
          WHEN c.dias_para_bloqueio BETWEEN 2 AND 5 THEN CONCAT('Aviso: Faltam ', c.dias_para_bloqueio, ' dias para o bloqueio')
          ELSE 'Sua conta está regular'
        END as mensagem_bloqueio,
        -- Informações adicionais úteis
        DATEDIFF(CURDATE(), c.ultimo_pagamento) as dias_desde_ultimo_pagamento,
        DAY(CURDATE()) as dia_atual,
        c.vencimento_dia as dia_vencimento
      FROM clientes c
      LEFT JOIN quadras q ON c.quadra_id = q.id  -- ✅ NOVO: JOIN com quadras
      WHERE c.status = 'Ativo'
    `;
    db.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar cliente específico com status detalhado para n8n (COM NOME DA QUADRA)
export const getClienteComStatusBloqueio = (clienteId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.id,
        c.nome,
        c.email,
        c.telefone,
        c.status_pagamento,
        c.vencimento_dia,
        c.cpf_cnpj,
        c.ultimo_pagamento,
        c.plano_valor,
        c.dias_para_bloqueio,
        c.link_ultima_cobranca,
        c.bloqueado,
        c.quadra_id,
        q.nome as quadra_nome,  -- ✅ NOVO: Nome da quadra
        -- Campos calculados para n8n
        CASE 
          WHEN c.bloqueado = 'sim' THEN 'bloqueado'
          WHEN c.dias_para_bloqueio = 0 THEN 'bloqueio_hoje'
          WHEN c.dias_para_bloqueio = 1 THEN 'bloqueio_amanha'
          WHEN c.dias_para_bloqueio BETWEEN 2 AND 5 THEN 'bloqueio_em_breve'
          ELSE 'regular'
        END as status_bloqueio_n8n,
        CASE 
          WHEN c.bloqueado = 'sim' THEN 'Seu sistema de replays está BLOQUEADA. Entre em contato para regularizar.'
          WHEN c.dias_para_bloqueio = 0 THEN 'ATENÇÃO: Seu sistema de replays será BLOQUEADO HOJE!'
          WHEN c.dias_para_bloqueio = 1 THEN 'ALERTA: Seu sistema de replays será bloqueado AMANHÃ!'
          WHEN c.dias_para_bloqueio BETWEEN 2 AND 5 THEN CONCAT('Aviso: Faltam ', c.dias_para_bloqueio, ' dias para o bloqueio')
          ELSE 'Sua conta está regular'
        END as mensagem_bloqueio,
        -- Para lógica no n8n
        CASE WHEN c.bloqueado = 'sim' THEN 1 ELSE 0 END as ja_bloqueado,
        CASE WHEN c.dias_para_bloqueio = 0 THEN 1 ELSE 0 END as bloqueia_hoje,
        CASE WHEN c.dias_para_bloqueio = 1 THEN 1 ELSE 0 END as bloqueia_amanha,
        c.dias_para_bloqueio as dias_restantes
      FROM clientes c
      LEFT JOIN quadras q ON c.quadra_id = q.id  -- ✅ NOVO: JOIN com quadras
      WHERE c.id = ?
    `;
    db.query(query, [clienteId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Atualizar dias para bloqueio e status de bloqueio
export const atualizarDiasBloqueio = (id, diasParaBloqueio, bloqueado) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE clientes SET dias_para_bloqueio = ?, bloqueado = ? WHERE id = ?';
    db.query(query, [diasParaBloqueio, bloqueado, id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Marcar cliente como desbloqueado E LIBERAR A QUADRA
export const marcarClienteComoDesbloqueado = (id) => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        return reject(err);
      }

      connection.beginTransaction(async (beginErr) => {
        if (beginErr) {
          connection.release();
          return reject(beginErr);
        }

        try {
          // 1. Buscar dados do cliente para obter a quadra_id
          const [clientes] = await connection.promise().execute('SELECT quadra_id FROM clientes WHERE id = ?', [id]);
          
          if (clientes.length === 0) {
            connection.rollback(() => {
              connection.release();
              reject(new Error('Cliente não encontrado'));
            });
            return;
          }

          const cliente = clientes[0];
          const quadraId = cliente.quadra_id;

          // 2. Atualizar cliente como desbloqueado
          await connection.promise().execute('UPDATE clientes SET bloqueado = "nao", dias_para_bloqueio = NULL WHERE id = ?', [id]);

          // 3. ✅ LIBERAR A QUADRA se existir
          if (quadraId) {
            await connection.promise().execute('UPDATE quadras SET atrasado = "nao" WHERE id = ?', [quadraId]);
            console.log(`✅ Quadra ${quadraId} liberada - Cliente ${id} desbloqueado`);
          }

          connection.commit((commitErr) => {
            if (commitErr) {
              connection.rollback(() => {
                connection.release();
                reject(commitErr);
              });
              return;
            }

            connection.release();
            resolve({ affectedRows: 1, quadraLiberada: !!quadraId });
          });
          
        } catch (error) {
          connection.rollback(() => {
            connection.release();
            reject(error);
          });
        }
      });
    });
  });
};

// Marcar cliente como bloqueado E BLOQUEAR A QUADRA
export const marcarClienteComoBloqueado = (id) => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        return reject(err);
      }

      connection.beginTransaction(async (beginErr) => {
        if (beginErr) {
          connection.release();
          return reject(beginErr);
        }

        try {
          // 1. Buscar dados do cliente para obter a quadra_id
          const [clientes] = await connection.promise().execute('SELECT quadra_id FROM clientes WHERE id = ?', [id]);
          
          if (clientes.length === 0) {
            connection.rollback(() => {
              connection.release();
              reject(new Error('Cliente não encontrado'));
            });
            return;
          }

          const cliente = clientes[0];
          const quadraId = cliente.quadra_id;

          // 2. Atualizar cliente como bloqueado
          await connection.promise().execute('UPDATE clientes SET bloqueado = "sim", dias_para_bloqueio = 0 WHERE id = ?', [id]);

          // 3. ✅ BLOQUEAR A QUADRA se existir
          if (quadraId) {
            await connection.promise().execute('UPDATE quadras SET atrasado = "sim" WHERE id = ?', [quadraId]);
            console.log(`🚨 Quadra ${quadraId} bloqueada - Cliente ${id} bloqueado`);
          }

          connection.commit((commitErr) => {
            if (commitErr) {
              connection.rollback(() => {
                connection.release();
                reject(commitErr);
              });
              return;
            }

            connection.release();
            resolve({ affectedRows: 1, quadraBloqueada: !!quadraId });
          });
          
        } catch (error) {
          connection.rollback(() => {
            connection.release();
            reject(error);
          });
        }
      });
    });
  });
};

// Atualizar apenas dias para bloqueio
export const atualizarApenasDiasBloqueio = (id, diasParaBloqueio) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE clientes SET dias_para_bloqueio = ? WHERE id = ?';
    db.query(query, [diasParaBloqueio, id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Buscar cliente com dados da quadra
export const getClienteComQuadra = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.*, q.nome as quadra_nome 
      FROM clientes c
      LEFT JOIN quadras q ON c.quadra_id = q.id
      WHERE c.id = ?
    `;
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Criar novo cliente
export const createCliente = (clienteData) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO clientes (
      nome, email, telefone, cpf_cnpj, endereco, numero, complemento, bairro, cidade, cep,
      plano_nome, plano_valor, vencimento_dia, data_inicio, data_proxima_cobranca, ultimo_pagamento,
      metodo_pagamento, status_pagamento, status, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      clienteData.nome,
      clienteData.email,
      clienteData.telefone,
      clienteData.cpf_cnpj,
      clienteData.endereco,
      clienteData.numero,
      clienteData.complemento,
      clienteData.bairro,
      clienteData.cidade,
      clienteData.cep,
      clienteData.plano_nome,
      clienteData.plano_valor,
      clienteData.vencimento_dia,
      clienteData.data_inicio,
      clienteData.data_proxima_cobranca,
      clienteData.ultimo_pagamento,
      clienteData.metodo_pagamento,
      clienteData.status_pagamento,
      clienteData.status,
      clienteData.observacoes
    ];

    db.query(query, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Buscar todos os clientes
export const getAllClientes = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM clientes', (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar cliente por ID
export const getClienteById = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM clientes WHERE id = ?', [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar cliente por WIDEPAYID
export const getClienteByWidePayId = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM clientes WHERE widepay_id = ?', [id], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar clientes inadimplentes (Atrasado ou Pendente)
export const getClientesInadimplentes = () => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM clientes WHERE status_pagamento IN ("Atrasado", "Pendente")',
      (err, results) => {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
};

export const marcarClienteComoPago = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE clientes 
      SET 
        status_pagamento = 'Pago', 
        ultimo_pagamento = CURDATE()
      WHERE id = ?
    `;
    db.query(sql, [id], (err, result) => {
      if (err) reject(err);
      resolve(result.affectedRows);
    });
  });
};

export const marcarClienteComoPendente = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE clientes 
      SET 
        status_pagamento = 'Pendente', 
        ultimo_pagamento = CURDATE()
      WHERE id = ?
    `;
    db.query(sql, [id], (err, result) => {
      if (err) reject(err);
      resolve(result.affectedRows);
    });
  });
};

export const marcarClienteComoAtrasado = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE clientes 
      SET 
        status_pagamento = 'Atrasado'
      WHERE id = ?
    `;
    db.query(sql, [id], (err, result) => {
      if (err) reject(err);
      resolve(result.affectedRows);
    });
  });
};

export const updateCliente = (id, clienteData) => {
  const fields = [];
  const values = [];

  for (const key in clienteData) {
    if (key === 'id') continue; // Nunca atualize o id

    fields.push(`${key} = ?`);
    values.push(clienteData[key]);
  }

  if (fields.length === 0) {
    // Nenhum campo para atualizar, retorna resultado vazio
    return Promise.resolve({ affectedRows: 0 });
  }

  const query = `
    UPDATE clientes
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  values.push(id);

  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// Deletar cliente
export const deleteCliente = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM clientes WHERE id = ?', [id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};