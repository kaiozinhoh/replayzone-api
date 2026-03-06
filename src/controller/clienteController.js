import * as clienteModel from '../models/clienteModel.js';

// controller/clienteController.js - VERSÃO COM NOME DA QUADRA

// Buscar todos os clientes com status de bloqueio para n8n
export const getClientesComStatusBloqueio = async (req, res) => {
  try {
    const clientes = await clienteModel.getClientesComStatusBloqueio();
    
    // Array direto (igual getClientesInadimplentes)
    const clientesFormatados = clientes.map(cliente => ({
      // Dados básicos
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      cpf_cnpj: cliente.cpf_cnpj,
      telefone: cliente.telefone,
      status_pagamento: cliente.status_pagamento,
      link_ultima_cobranca: cliente.link_ultima_cobranca,
      plano_valor: cliente.plano_valor,
      
      // ✅ NOVO: Nome da quadra
      quadra_nome: cliente.quadra_nome || 'Não vinculada',
      quadra_id: cliente.quadra_id,
      
      // Status de bloqueio (FACILITA A LÓGICA NO N8N)
      status_bloqueio: cliente.status_bloqueio_n8n, // 'bloqueado', 'bloqueio_hoje', 'bloqueio_amanha', 'bloqueio_em_breve', 'regular'
      mensagem_bloqueio: cliente.mensagem_bloqueio,
      bloqueado: cliente.bloqueado === 'sim',
      dias_para_bloqueio: cliente.dias_para_bloqueio,
      
      // Flags booleanas para facilitar condições no n8n
      ja_bloqueado: cliente.bloqueado === 'sim',
      bloqueia_hoje: cliente.dias_para_bloqueio === 0,
      bloqueia_amanha: cliente.dias_para_bloqueio === 1,
      bloqueia_em_breve: cliente.dias_para_bloqueio >= 2 && cliente.dias_para_bloqueio <= 5,
      esta_regular: cliente.dias_para_bloqueio === null || cliente.dias_para_bloqueio > 5,
      
      // Informações adicionais
      vencimento_dia: cliente.vencimento_dia,
      ultimo_pagamento: cliente.ultimo_pagamento,
      
      // Campos do cálculo (para debug se necessário)
      dias_desde_ultimo_pagamento: cliente.dias_desde_ultimo_pagamento,
      dia_atual: cliente.dia_atual,
      dia_vencimento: cliente.dia_vencimento
    }));

    // Retorna array direto, não objeto com propriedade "clientes"
    res.status(200).json(clientesFormatados);
    
  } catch (error) {
    console.error('Erro ao buscar clientes com status de bloqueio:', error);
    res.status(500).json({ message: 'Erro ao buscar status de bloqueio dos clientes.' });
  }
};

// Buscar cliente específico com status de bloqueio para n8n
export const getClienteComStatusBloqueio = async (req, res) => {
  const { id } = req.params;

  try {
    const clientes = await clienteModel.getClienteComStatusBloqueio(id);
    
    if (clientes.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    const cliente = clientes[0];
    
    const dadosFormatados = {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      cpf_cnpj: cliente.cpf_cnpj,
      status_pagamento: cliente.status_pagamento,
      link_ultima_cobranca: cliente.link_ultima_cobranca,
      plano_valor: cliente.plano_valor,
      
      // ✅ NOVO: Nome da quadra
      quadra_nome: cliente.quadra_nome || 'Não vinculada',
      quadra_id: cliente.quadra_id,
      
      // Status de bloqueio formatado para n8n
      status_bloqueio: cliente.status_bloqueio_n8n,
      mensagem_bloqueio: cliente.mensagem_bloqueio,
      bloqueado: cliente.bloqueado === 'sim',
      dias_para_bloqueio: cliente.dias_para_bloqueio,
      
      // Flags para condições no n8n
      ja_bloqueado: cliente.ja_bloqueado === 1,
      bloqueia_hoje: cliente.bloqueia_hoje === 1,
      bloqueia_amanha: cliente.bloqueia_amanha === 1,
      dias_restantes: cliente.dias_restantes,
      
      vencimento_dia: cliente.vencimento_dia,
      ultimo_pagamento: cliente.ultimo_pagamento
    };

    // Retorna objeto direto do cliente
    res.status(200).json(dadosFormatados);
    
  } catch (error) {
    console.error('Erro ao buscar cliente com status de bloqueio:', error);
    res.status(500).json({ message: 'Erro ao buscar status de bloqueio do cliente.' });
  }
};

// Webhook para n8n (POST) - VERSÃO CORRIGIDA
export const webhookStatusBloqueio = async (req, res) => {
  try {
    const { cliente_id, action } = req.body;
    
    let dados;
    if (cliente_id) {
      // Dados de um cliente específico
      const clientes = await clienteModel.getClienteComStatusBloqueio(cliente_id);
      if (clientes.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cliente não encontrado.' 
        });
      }
      dados = clientes[0];
    } else {
      // ✅ CORREÇÃO: Dados de todos os clientes - array direto
      const clientes = await clienteModel.getClientesComStatusBloqueio();
      dados = clientes; // Array direto, não objeto
    }
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      action: action || 'status_check',
      data: dados
    });
    
  } catch (error) {
    console.error('Erro no webhook de status bloqueio:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// Criar novo cliente
export const createCliente = async (req, res) => {
  const cliente = req.body;

  // Campos obrigatórios básicos
  if (!cliente.nome || !cliente.email || !cliente.vencimento_dia || !cliente.plano_valor) {
    return res.status(400).json({ message: 'Nome, email, vencimento e valor do plano são obrigatórios.' });
  }

  try {
    const result = await clienteModel.createCliente(cliente);
    res.status(201).json({ message: 'Cliente criado com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ message: 'Erro ao criar cliente.' });
  }
};

// Marcar cliente como desbloqueado
export const marcarClienteDesbloqueado = async (req, res) => {
  try {
    const clienteId = req.params.id;
    const result = await clienteModel.marcarClienteComoDesbloqueado(clienteId);
    
    res.json({ 
      success: true, 
      message: 'Cliente e quadra desbloqueados com sucesso',
      atualizado: result.affectedRows,
      quadraLiberada: result.quadraLiberada
    });
  } catch (error) {
    console.error('Erro ao desbloquear cliente:', error);
    res.status(500).json({ 
      error: 'Erro ao desbloquear cliente',
      details: error.message 
    });
  }
};


// Listar todos os clientes
export const getAllClientes = async (req, res) => {
  try {
    const clientes = await clienteModel.getAllClientes();
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes.' });
  }
};

// Buscar cliente por ID
export const getClienteById = async (req, res) => {
  const { id } = req.params;

  try {
    const clientes = await clienteModel.getClienteById(id);
    if (clientes.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    res.status(200).json(clientes[0]);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro ao buscar cliente.' });
  }
};
// Buscar cliente por ID
export const getClienteByWidePayId = async (req, res) => {
  const { id } = req.params;

  try {
    const clientes = await clienteModel.getClienteByWidePayId(id);
    if (clientes.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    res.status(200).json(clientes[0]);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro ao buscar cliente.' });
  }
};

// Buscar clientes inadimplentes
export const getClientesInadimplentes = async (req, res) => {
  try {
    const clientes = await clienteModel.getClientesInadimplentes();
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Erro ao buscar inadimplentes:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes inadimplentes.' });
  }
};

export const marcarClienteAtrasado = async (req, res) => {
  try {
    const clienteId = req.params.id;
    const result = await clienteModel.marcarClienteComoAtrasado(clienteId);
    res.json({ success: true, atualizados: result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status dos clientes' });
  }
};
export const marcarClientePendente = async (req, res) => {
  try {
    const clienteId = req.params.id;
    const result = await clienteModel.marcarClienteComoAtrasado(clienteId);
    res.json({ success: true, atualizados: result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status dos clientes' });
  }
};

export const marcarClientePago = async (req, res) => {
  try {
    const clienteId = req.params.id;
    const result = await clienteModel.marcarClienteComoPago(clienteId);
    res.json({ success: true, atualizado: result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar cliente como pago' });
  }
};
export const updateCliente = async (req, res) => {
  const { id } = req.params;
  const cliente = req.body;

  try {
    const result = await clienteModel.updateCliente(id, cliente);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado ou nada foi alterado.' });
    }

    res.status(200).json({ message: 'Cliente atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ message: 'Erro ao atualizar cliente.' });
  }
};


// Excluir cliente
export const deleteCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await clienteModel.deleteCliente(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    res.status(200).json({ message: 'Cliente excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ message: 'Erro ao excluir cliente.' });
  }
};
