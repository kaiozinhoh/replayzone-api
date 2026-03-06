import db from '../config/db.js';

// ============================================
// COBRANÇAS - CRUD Completo
// ============================================

// Criar nova cobrança
export const createCobranca = (cobrancaData) => {
  return new Promise((resolve, reject) => {
    console.log('💾 Criando cobrança:', cobrancaData);

    const query = `
      INSERT INTO cobrancas 
      (cliente_id, valor, forma_pagamento, status, data_vencimento, 
       mes_referencia, descricao, link_pagamento, codigo_barras, 
       pix_copia_cola, transaction_id, gateway, observacoes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      cobrancaData.cliente_id,
      cobrancaData.valor,
      cobrancaData.forma_pagamento || null,
      cobrancaData.status || 'pendente',
      cobrancaData.data_vencimento,
      cobrancaData.mes_referencia,
      cobrancaData.descricao || '',
      cobrancaData.link_pagamento || null,
      cobrancaData.codigo_barras || null,
      cobrancaData.pix_copia_cola || null,
      cobrancaData.transaction_id || null,
      cobrancaData.gateway || null,
      cobrancaData.observacoes || null
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('❌ Erro no INSERT cobrancas:', err);
        return reject(err);
      }
      console.log('✅ Cobrança criada com ID:', result.insertId);
      resolve(result);
    });
  });
};

// Buscar todas as cobranças
export const getAllCobrancas = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.*, cl.nome as cliente_nome, cl.plano_valor, cl.quadra_id, q.nome as quadra_nome
      FROM cobrancas c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN quadras q ON cl.quadra_id = q.id
      ORDER BY c.data_vencimento ASC, c.created_at DESC
    `;
    db.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar cobranças por cliente
export const getCobrancasPorCliente = (clienteId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.*, cl.nome as cliente_nome 
      FROM cobrancas c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.cliente_id = ?
      ORDER BY c.data_vencimento DESC, c.created_at DESC
    `;
    db.query(query, [clienteId], (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Buscar cobrança por ID
export const getCobrancaById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.*, cl.nome as cliente_nome, cl.plano_valor
      FROM cobrancas c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.id = ?
    `;
    db.query(query, [id], (err, results) => {
      if (err) reject(err);
      resolve(results[0] || null);
    });
  });
};



// ============================================
// ATUALIZAR COBRANÇA (CORRIGIDO)
// ============================================
export const updateCobranca = (id, cobrancaData) => {
  return new Promise((resolve, reject) => {
    // Construir query dinamicamente apenas com os campos fornecidos
    const fields = [];
    const values = [];

    // Mapear campos permitidos para atualização
    const camposPermitidos = [
      'valor', 'forma_pagamento', 'status', 'data_vencimento',
      'mes_referencia', 'descricao', 'link_pagamento', 
      'codigo_barras', 'pix_copia_cola', 'transaction_id',
      'gateway', 'observacoes', 'data_pagamento', 'data_cancelamento'
    ];

    for (const campo of camposPermitidos) {
      if (cobrancaData[campo] !== undefined) {
        fields.push(`${campo} = ?`);
        values.push(cobrancaData[campo]);
      }
    }

    if (fields.length === 0) {
      return resolve({ affectedRows: 0 });
    }

    const query = `
      UPDATE cobrancas 
      SET ${fields.join(', ')}
      WHERE id = ?
    `;

    values.push(id);

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('❌ Erro ao atualizar cobrança:', err);
        return reject(err);
      }
      console.log(`✅ Cobrança ${id} atualizada com sucesso`);
      resolve(result);
    });
  });
};

// ============================================
// VERIFICAR SE JÁ EXISTE COBRANÇA NO MÊS
// ============================================
export const verificarCobrancaExistente = (clienteId, mesReferencia) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id FROM cobrancas 
      WHERE cliente_id = ? AND mes_referencia = ?
    `;
    
    db.query(query, [clienteId, mesReferencia], (err, results) => {
      if (err) {
        console.error('❌ Erro ao verificar cobrança existente:', err);
        return reject(err);
      }
      resolve(results.length > 0);
    });
  });
};

// Excluir cobrança
export const deleteCobranca = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM cobrancas WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Buscar cobranças pendentes (vencidas ou a vencer)
export const getCobrancasPendentes = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.*, cl.nome as cliente_nome, cl.telefone, cl.plano_valor
      FROM cobrancas c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.status IN ('pendente', 'vencida')
      ORDER BY c.data_vencimento ASC
    `;
    db.query(query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Marcar cobranças como vencidas
export const atualizarCobrancasVencidas = () => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE cobrancas 
      SET status = 'vencida' 
      WHERE status = 'pendente' AND data_vencimento < CURDATE()
    `;
    db.query(query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// Gerar cobranças do mês para todos os clientes ativos
export const gerarCobrancasMensais = () => {
  return new Promise((resolve, reject) => {
    const dataAtual = new Date();
    const mesReferencia = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`;
    const dataVencimento = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-10`; // Dia 10

    const query = `
      INSERT INTO cobrancas (cliente_id, valor, data_vencimento, mes_referencia, descricao, status)
      SELECT 
        c.id, 
        c.plano_valor, 
        ?, 
        ?, 
        CONCAT('Mensalidade ', c.nome, ' - ', ?),
        'pendente'
      FROM clientes c
      WHERE c.status = 'Ativo' 
      AND NOT EXISTS (
        SELECT 1 FROM cobrancas cb 
        WHERE cb.cliente_id = c.id AND cb.mes_referencia = ?
      )
    `;
    
    db.query(query, [dataVencimento, mesReferencia, mesReferencia, mesReferencia], (err, result) => {
      if (err) {
        console.error('❌ Erro ao gerar cobranças mensais:', err);
        return reject(err);
      }
      console.log(`✅ ${result.affectedRows} cobranças geradas para ${mesReferencia}`);
      resolve(result);
    });
  });
};