import * as cobrancaModel from '../models/cobrancaModel.js';
import * as clienteModel from '../models/clienteModel.js';

// ============================================
// COBRANÇAS - Listar todas com filtros
// ============================================
export const getAllCobrancas = async (req, res) => {
  try {
    const { cliente_id, mes, status, vencimento_inicio, vencimento_fim } = req.query;
    
    // Primeiro, atualiza cobranças vencidas
    await cobrancaModel.atualizarCobrancasVencidas();
    
    // Busca todas as cobranças
    let cobrancas = await cobrancaModel.getAllCobrancas();
    
    // Aplicar filtros
    if (cliente_id) {
      cobrancas = cobrancas.filter(c => c.cliente_id == cliente_id);
    }
    if (mes) {
      cobrancas = cobrancas.filter(c => c.mes_referencia === mes);
    }
    if (status) {
      cobrancas = cobrancas.filter(c => c.status === status);
    }
    if (vencimento_inicio) {
      cobrancas = cobrancas.filter(c => c.data_vencimento >= vencimento_inicio);
    }
    if (vencimento_fim) {
      cobrancas = cobrancas.filter(c => c.data_vencimento <= vencimento_fim);
    }
    
    res.status(200).json(cobrancas);
    
  } catch (error) {
    console.error('❌ Erro ao buscar cobranças:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar cobranças.' 
    });
  }
};

// ============================================
// COBRANÇAS POR CLIENTE
// ============================================
export const getCobrancasByClienteId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cobrancas = await cobrancaModel.getCobrancasPorCliente(id);
    const cliente = await clienteModel.getClienteById(id);
    
    res.status(200).json({
      success: true,
      cliente: cliente[0] || null,
      cobrancas,
      total: cobrancas.length,
      pendentes: cobrancas.filter(c => c.status === 'pendente' || c.status === 'vencida').length
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar cobranças do cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar cobranças do cliente.' 
    });
  }
};

// ============================================
// COBRANÇA POR ID
// ============================================
export const getCobrancaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cobranca = await cobrancaModel.getCobrancaById(id);
    
    if (!cobranca) {
      return res.status(404).json({ 
        success: false,
        message: 'Cobrança não encontrada.' 
      });
    }
    
    res.status(200).json({
      ...cobranca
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar cobrança:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar cobrança.' 
    });
  }
};
// ============================================
// ============================================
// CRIAR COBRANÇA COM INTEGRAÇÃO WEBHOOK
// ============================================
export const createCobranca = async (req, res) => {
  try {
    const cobrancaData = req.body;
    
    if (!cobrancaData.cliente_id || !cobrancaData.valor || !cobrancaData.data_vencimento) {
      return res.status(400).json({ 
        success: false,
        message: 'Cliente, valor e data de vencimento são obrigatórios.' 
      });
    }
    
    // Verifica se cliente existe (COM DADOS DA QUADRA)
    const clientes = await clienteModel.getClienteComQuadra(cobrancaData.cliente_id);
    if (!clientes || clientes.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cliente não encontrado.' 
      });
    }
    
    const cliente = clientes[0];
    
    // ============================================
    // VERIFICAR SE JÁ EXISTE COBRANÇA PARA O MÊS
    // ============================================
    if (cobrancaData.mes_referencia) {
      const cobrancaExistente = await cobrancaModel.verificarCobrancaExistente(
        cobrancaData.cliente_id, 
        cobrancaData.mes_referencia
      );
      
      if (cobrancaExistente) {
        return res.status(409).json({ 
          success: false,
          message: `Já existe uma cobrança para este cliente no mês ${cobrancaData.mes_referencia}.`,
          error: 'DUPLICATE_COBRANCA'
        });
      }
    }
    
    // ============================================
    // PREPARAR DADOS PARA WEBHOOK
    // ============================================
    const pessoa = cliente.cpf_cnpj?.length === 11 ? 'Física' : 'Jurídica';
    
    const webhookData = [{
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      plano_valor: cliente.plano_valor,
      vencimento_dia: cobrancaData.data_vencimento,
      cpf_cnpj: cliente.cpf_cnpj || '',
      pessoa: pessoa,
      notificacao: "https://bot.replayzone.com.br/webhook/widepaywebhook"
    }];
    
    console.log('📤 Enviando dados para webhook de cobrança:', webhookData);
    
    // ============================================
    // ENVIAR PARA WEBHOOK
    // ============================================
    const webhookResponse = await fetch('https://bot.replayzone.com.br/webhook/gerarcobrancaswidepay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });
    
    const webhookResult = await webhookResponse.json();
    console.log('📥 Resposta do webhook:', webhookResult);
    
    // Verificar se a resposta é um array (como no exemplo da Widepay)
    const cobrancaExterna = Array.isArray(webhookResult) ? webhookResult[0] : webhookResult;
    
    if (!cobrancaExterna.sucesso) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao gerar cobrança no webhook',
        error: cobrancaExterna
      });
    }
    
    // ============================================
    // CRIAR COBRANÇA NO BANCO DE DADOS
    // ============================================
    const novaCobranca = {
      cliente_id: parseInt(cliente.id),
      valor: cliente.plano_valor,
      forma_pagamento: 'PIX',
      status: 'pendente',
      data_vencimento: cobrancaData.data_vencimento,
      mes_referencia: cobrancaData.mes_referencia,
      descricao: cobrancaData.descricao || `Mensalidade ${cliente.nome} - ${cobrancaData.mes_referencia}`,
      link_pagamento: cobrancaExterna.link || null,
      pix_copia_cola: cobrancaExterna.pix?.emv || null,
      transaction_id: cobrancaExterna.id?.toString() || null,
      gateway: 'widepay',
      observacoes: cobrancaData.observacoes || `Cobrança gerada via webhook em ${new Date().toLocaleString()}`
    };
    
    const result = await cobrancaModel.createCobranca(novaCobranca);
    const cobrancaId = result.insertId;
    
    // ============================================
    // ATUALIZAR CLIENTE COM DADOS DA COBRANÇA
    // ============================================
    const clienteUpdateData = {
      link_ultima_cobranca: cobrancaExterna.link,
      status_pagamento: 'Pendente',  // Cliente marcado como pendente
      widepay_id: cobrancaExterna.id,
      cobranca_id: cobrancaId
    };
    
    await clienteModel.updateCliente(cliente.id, clienteUpdateData);
    
    console.log(`✅ Cobrança #${cobrancaId} gerada para cliente ${cliente.nome}`);
    console.log(`📊 Cliente ${cliente.nome} atualizado: status_pagamento = Pendente, widepay_id = ${cobrancaExterna.id}`);
    
    // ============================================
    // PREPARAR MENSAGEM PARA WHATSAPP
    // ============================================
    const mensagemWhatsApp = {
      Phone: cliente.telefone,
      Body: `Olá, ${cliente.nome}! 😊\n\n` +
            `Espero que esteja tudo bem com você.\n\n` +
            `Estamos passando aqui com carinho para lembrar sobre a sua mensalidade no valor de R$ ${parseFloat(cliente.plano_valor).toFixed(2)}.\n\n` +
            `💡 *Essa cobrança é referente ao sistema de replays da quadra ${cliente.quadra_nome || 'ReplayZone'}.*\n\n` +
            `Você pode acessar sua cobrança no link abaixo:\n` +
            `${cobrancaExterna.link}\n\n` +
            `Qualquer dúvida, estamos à disposição para te ajudar!\n\n` +
            `Muito obrigado pela confiança. 💙\n\n` +
            `Vou deixar abaixo o código copia e cola — você também pode pagar por aqui!!`,
      Id: `COBRANCA_${cliente.id}_${Date.now()}`
    };
    
    // ============================================
    // RETORNAR RESPOSTA COMPLETA
    // ============================================
    res.status(201).json({
      success: true,
      message: 'Cobrança criada com sucesso.',
      id: cobrancaId,
      cobranca: {
        id: cobrancaId,
        link: cobrancaExterna.link,
        pix: cobrancaExterna.pix,
        transaction_id: cobrancaExterna.id,
        pix_copia_cola: cobrancaExterna.pix?.emv || null
      },
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        plano_valor: cliente.plano_valor,
        quadra_nome: cliente.quadra_nome || 'ReplayZone',
        status_pagamento: 'Pendente',
        widepay_id: cobrancaExterna.id,
        link_ultima_cobranca: cobrancaExterna.link
      },
      whatsapp: mensagemWhatsApp  // ← DADOS PARA ENVIAR VIA WHATSAPP
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar cobrança:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar cobrança.' 
    });
  }
};

// ============================================
// ENVIAR COBRANÇA VIA WHATSAPP
// ============================================
export const enviarCobrancaWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca a cobrança
    const cobranca = await cobrancaModel.getCobrancaById(id);
    if (!cobranca) {
      return res.status(404).json({ 
        success: false,
        message: 'Cobrança não encontrada.' 
      });
    }
    
    // Busca o cliente com dados da quadra
    const clientes = await clienteModel.getClienteComQuadra(cobranca.cliente_id);
    if (!clientes || clientes.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cliente não encontrado.' 
      });
    }
    
    const cliente = clientes[0];
    
    console.log(`📤 Enviando cobrança #${id} via WhatsApp para ${cliente.nome}`);
    
    // ============================================
    // PREPARAR MENSAGEM PARA WHATSAPP
    // ============================================
    const mensagemWhatsApp = {
      Phone: cliente.telefone,
      Body: `Olá, ${cliente.nome}! 😊\n\n` +
            `Espero que esteja tudo bem com você.\n\n` +
            `Estamos passando aqui com carinho para lembrar sobre a sua mensalidade no valor de R$ ${parseFloat(cliente.plano_valor).toFixed(2)}.\n\n` +
            `💡 *Essa cobrança é referente ao sistema de replays da quadra ${cliente.quadra_nome || 'ReplayZone'}.*\n\n` +
            `Você pode acessar sua cobrança no link abaixo:\n` +
            `${cobranca.link_pagamento || cliente.link_ultima_cobranca}\n\n` +
            `👇 *CÓDIGO PIX COPIA E COLA:*\n` +
            `\`${cobranca.pix_copia_cola || 'Código não disponível'}\`\n\n` +
            `Basta copiar este código e colar no seu aplicativo do banco para pagar via PIX.\n\n` +
            `Qualquer dúvida, estamos à disposição para te ajudar!\n\n` +
            `Muito obrigado pela confiança. 💙`,
      Id: `COBRANCA_${cliente.id}_${Date.now()}`
    };
    
    console.log('📱 Dados para WhatsApp:', mensagemWhatsApp);
    
    // ============================================
    // ENVIAR PARA WEBHOOK DO WHATSAPP
    // ============================================
    const webhookResponse = await fetch('https://bot.replayzone.com.br/webhook/enviarcobrancawhatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mensagemWhatsApp)
    });
    
    const webhookResult = await webhookResponse.json();
    console.log('📥 Resposta do webhook WhatsApp:', webhookResult);
    
    // ============================================
    // RETORNAR RESPOSTA
    // ============================================
    res.status(200).json({
      success: true,
      message: 'Cobrança enviada via WhatsApp com sucesso.',
      data: {
        cobranca_id: parseInt(id),
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        telefone: cliente.telefone,
        webhook_response: webhookResult
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar cobrança via WhatsApp:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao enviar cobrança via WhatsApp.' 
    });
  }
};

// ============================================
// DAR BAIXA EM COBRANÇA (VIA PIX)
// ============================================
export const darBaixaCobranca = async (req, res) => {
  try {
    const { id } = req.params;
    const { data_pagamento } = req.body;
    
    // Busca a cobrança
    const cobranca = await cobrancaModel.getCobrancaById(id);
    if (!cobranca) {
      return res.status(404).json({ 
        success: false,
        message: 'Cobrança não encontrada.' 
      });
    }
    
    // Busca o cliente
    const clientes = await clienteModel.getClienteById(cobranca.cliente_id);
    if (!clientes || clientes.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cliente não encontrado.' 
      });
    }
    
    const cliente = clientes[0];
    const dataPagamento = data_pagamento || new Date().toISOString().split('T')[0];
    
    console.log(`📝 Dando baixa na cobrança #${id} para cliente ${cliente.nome}`);
    
    // ============================================
    // 1. ATUALIZAR COBRANÇA COMO PAGA NO BANCO LOCAL
    // ============================================
    await cobrancaModel.updateCobranca(id, {
      status: 'paga',
      data_pagamento: dataPagamento,
      forma_pagamento: 'PIX'
    });
    
    // ============================================
    // 2. ATUALIZAR CLIENTE COMO PAGO
    // ============================================
    const clienteUpdateData = {
      status_pagamento: 'Pago',
      ultimo_pagamento: dataPagamento,
      widepay_id: null,
      link_ultima_cobranca: null
    };
    
    await clienteModel.updateCliente(cliente.id, clienteUpdateData);
    
    // ============================================
    // 3. ENVIAR PARA WEBHOOK DA WIDEPAY (BAIXAR COBRANÇA)
    // ============================================
    if (cliente.widepay_id) {
      try {
        console.log(`📤 Enviando para webhook Widepay: ID ${cliente.widepay_id}`);
        
        // Formato igual ao curl do exemplo
        const widepayData = new URLSearchParams();
        widepayData.append('id', cliente.widepay_id);
        
        const webhookResponse = await fetch('https://bot.replayzone.com.br/webhook/baixarcobrancaswidepay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: widepayData.toString()
        });
        
        const webhookResult = await webhookResponse.json();
        console.log('📥 Resposta do webhook Widepay:', webhookResult);
        
      } catch (webhookError) {
        console.error('⚠️ Erro ao enviar para webhook Widepay:', webhookError.message);
        // Não interrompe o fluxo principal
      }
    } else {
      console.log(`⚠️ Cliente ${cliente.id} não tem widepay_id para baixar`);
    }
    
    console.log(`✅ Cobrança #${id} baixada com sucesso para cliente ${cliente.nome}`);
    
    // ============================================
    // 4. RETORNAR RESPOSTA
    // ============================================
    res.status(200).json({
      success: true,
      message: 'Cobrança baixada com sucesso.',
      data: {
        cobranca: {
          id: parseInt(id),
          status: 'paga',
          data_pagamento: dataPagamento
        },
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          status_pagamento: 'Pago',
          ultimo_pagamento: dataPagamento,
          widepay_id: cliente.widepay_id
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao dar baixa na cobrança:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao dar baixa na cobrança.' 
    });
  }
};

// ============================================
// ATUALIZAR COBRANÇA (ATUALIZADO)
// ============================================
export const updateCobranca = async (req, res) => {
  try {
    const { id } = req.params;
    const cobrancaData = req.body;
    
    const cobranca = await cobrancaModel.getCobrancaById(id);
    if (!cobranca) {
      return res.status(404).json({ 
        success: false,
        message: 'Cobrança não encontrada.' 
      });
    }
    
    await cobrancaModel.updateCobranca(id, cobrancaData);
    
    // Se a cobrança foi marcada como paga, atualiza o cliente
    if (cobrancaData.status === 'paga') {
      try {
        await clienteModel.atualizarStatusPagamento(cobranca.cliente_id, 'Pago', cobrancaData.data_pagamento);
        console.log(`✅ Cliente ${cobranca.cliente_id} marcado como pago via atualização de cobrança`);
      } catch (updateError) {
        console.error('⚠️ Erro ao atualizar status do cliente:', updateError.message);
      }
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Cobrança atualizada com sucesso.' 
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar cobrança:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar cobrança.' 
    });
  }
};

// ============================================
// EXCLUIR COBRANÇA
// ============================================
export const deleteCobranca = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await cobrancaModel.deleteCobranca(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cobrança não encontrada.' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Cobrança excluída com sucesso.' 
    });
    
  } catch (error) {
    console.error('❌ Erro ao excluir cobrança:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao excluir cobrança.' 
    });
  }
};

// ============================================
// COBRANÇAS PENDENTES
// ============================================
export const getCobrancasPendentes = async (req, res) => {
  try {
    await cobrancaModel.atualizarCobrancasVencidas();
    const cobrancas = await cobrancaModel.getCobrancasPendentes();
    
    const totais = {
      total: cobrancas.length,
      valorTotal: cobrancas.reduce((sum, c) => sum + parseFloat(c.valor), 0),
      vencidas: cobrancas.filter(c => c.status === 'vencida').length,
      aVencer: cobrancas.filter(c => c.status === 'pendente').length
    };
    
    res.status(200).json({
      success: true,
      totais,
      cobrancas
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar cobranças pendentes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar cobranças pendentes.' 
    });
  }
};

// ============================================
// GERAR COBRANÇAS MENSAIS (ATUALIZADO)
// ============================================
export const gerarCobrancasMensais = async (req, res) => {
  try {
    // Esta função já deve ter a lógica de evitar duplicidade no model
    const result = await cobrancaModel.gerarCobrancasMensais();
    
    res.status(200).json({
      success: true,
      message: `${result.affectedRows} cobranças geradas com sucesso.`,
      quantidade: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar cobranças mensais:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao gerar cobranças mensais.' 
    });
  }
};
// ============================================
// MARCAR COBRANÇA COMO PAGA (NOVO)
// ============================================
export const marcarCobrancaComoPaga = async (req, res) => {
  try {
    const { id } = req.params;
    const { data_pagamento, forma_pagamento } = req.body;
    
    // Busca a cobrança
    const cobranca = await cobrancaModel.getCobrancaById(id);
    if (!cobranca) {
      return res.status(404).json({ 
        success: false,
        message: 'Cobrança não encontrada.' 
      });
    }
    
    // Atualiza a cobrança como paga
    await cobrancaModel.updateCobranca(id, {
      status: 'paga',
      data_pagamento: data_pagamento || new Date().toISOString().split('T')[0],
      forma_pagamento: forma_pagamento || 'PIX'
    });
    
    // Atualiza o cliente como pago
    await clienteModel.atualizarStatusPagamento(
      cobranca.cliente_id, 
      'Pago', 
      data_pagamento || new Date().toISOString().split('T')[0]
    );
    
    res.status(200).json({
      success: true,
      message: 'Cobrança marcada como paga e cliente atualizado com sucesso.',
      cobrancaId: id,
      clienteId: cobranca.cliente_id
    });
    
  } catch (error) {
    console.error('❌ Erro ao marcar cobrança como paga:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao marcar cobrança como paga.' 
    });
  }
};