import * as reservaModel from '../models/reservaModel.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import axios from 'axios';
import * as adminModel from '../models/adminModel.js'; // Adicione esta importação

// Configura dayjs uma única vez
dayjs.extend(utc);
dayjs.extend(timezone);

// controllers/reservaController.js

// Buscar reservas fixas por quadra
export const getReservasFixas = async (req, res) => {
  try {
    const { quadra_id } = req.query;
    
    if (!quadra_id) {
      return res.status(400).json({ 
        success: false,
        error: "quadra_id é obrigatório" 
      });
    }

    const reservasFixas = await reservaModel.getReservasFixasPorQuadra(quadra_id);
    
    // Formatar a resposta
    const reservasFormatadas = reservasFixas.map(reserva => ({
      id: reserva.id,
      dia_semana: reserva.dia_semana,
      horario: {
        inicio: reserva.hora_inicio,
        fim: reserva.hora_fim
      },
      subquadra: {
        id: reserva.subquadra_id,
        nome: reserva.subquadra_nome
      },
      quadra: {
        id: reserva.quadra_id,
        nome: reserva.quadra_nome
      },
      cliente: {
        nome: reserva.cliente_nome,
        telefone: reserva.cliente_telefone
      },
      preco: reserva.preco,
      status_pagamento: reserva.status_pagamento,
      criado_em: reserva.criado_em
    }));

    res.json({
      success: true,
      total_reservas_fixas: reservasFixas.length,
      reservas_fixas: reservasFormatadas
    });

  } catch (error) {
    console.error("Erro ao buscar reservas fixas:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao buscar reservas fixas",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Criar reserva fixa
export const criarReservaFixa = async (req, res) => {
  try {
    const {
      subquadra_id,
      quadra_id,
      dia_semana,
      hora_inicio,
      hora_fim,
      cliente_nome,
      cliente_telefone,
      preco,
      status_pagamento
    } = req.body;

    if (!subquadra_id || !quadra_id || !dia_semana || !hora_inicio || !hora_fim || !cliente_nome || !cliente_telefone) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Verificar conflito
    const conflito = await reservaModel.verificarConflitoFixa(subquadra_id, dia_semana, hora_inicio, hora_fim);
    if (conflito) {
      return res.status(409).json({ error: "Já existe uma reserva fixa nesse horário" });
    }

    await reservaModel.criarReservaFixa({
      subquadra_id,
      quadra_id,
      dia_semana,
      hora_inicio,
      hora_fim,
      cliente_nome,
      cliente_telefone,
      preco,
      status_pagamento
    });

    res.status(201).json({ 
      success: true,
      message: "Reserva fixa criada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao criar reserva fixa:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao criar reserva fixa" 
    });
  }
};

// Excluir reserva fixa
export const excluirReservaFixa = async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: "ID da reserva fixa é obrigatório" });
    }

    const resultado = await reservaModel.excluirReservaFixa(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Reserva fixa não encontrada.' });
    }

    res.json({ 
      success: true,
      message: 'Reserva fixa excluída com sucesso.' 
    });
  } catch (error) {
    console.error("Erro ao excluir reserva fixa:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao excluir reserva fixa" 
    });
  }
};

// Gerar reservas a partir das fixas
export const gerarReservasFromFixas = async (req, res) => {
  try {
    const { data_inicio, data_fim, quadra_id } = req.body;
    
    if (!data_inicio || !data_fim || !quadra_id) {
      return res.status(400).json({ error: "data_inicio, data_fim e quadra_id são obrigatórios" });
    }

    const resultado = await reservaModel.gerarReservasFromFixas(data_inicio, data_fim, quadra_id);

    res.json({
      success: true,
      message: `Reservas geradas com sucesso: ${resultado.affectedRows} reservas criadas`,
      total_gerado: resultado.affectedRows
    });
  } catch (error) {
    console.error("Erro ao gerar reservas a partir das fixas:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao gerar reservas" 
    });
  }
};

// Buscar reservas por quadra_id e data
export const getReservasPorQuadraEData = async (req, res) => {
  try {
    const { quadra_id, data } = req.query;
    
    if (!quadra_id || !data) {
      return res.status(400).json({ 
        success: false,
        error: "quadra_id e data são obrigatórios" 
      });
    }

    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
      return res.status(400).json({ 
        success: false,
        error: "Formato de data inválido. Use YYYY-MM-DD" 
      });
    }

    const reservas = await reservaModel.getReservasPorQuadraEData(quadra_id, data);
    
    // Formatar a resposta
    const reservasFormatadas = reservas.map(reserva => ({
      id: reserva.id,
      data: reserva.data,
      horario: {
        inicio: reserva.hora_inicio,
        fim: reserva.hora_fim
      },
      subquadra: {
        id: reserva.subquadra_id,
        nome: reserva.subquadra_nome
      },
      quadra: {
        id: reserva.quadra_id,
        nome: reserva.quadra_nome
      },
      cliente: {
        nome: reserva.cliente_nome,
        telefone: reserva.cliente_telefone
      },
      status: reserva.status,
      status_pagamento: reserva.status_pagamento,
      preco: reserva.preco,
      token: reserva.token
    }));

    res.json({
      success: true,
      total_reservas: reservas.length,
      reservas: reservasFormatadas
    });

  } catch (error) {
    console.error("Erro ao buscar reservas por quadra e data:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao buscar reservas",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const diasSemanaMap = {
  1: 'segunda',
  2: 'terça',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sábado',
  7: 'domingo',
};

// controllers/reservaController.js

// Buscar reservas pendentes a partir de um horário específico
export const getReservasPendentesAPartirDe = async (req, res) => {
  try {
    const { quadra_id, data, hora } = req.query;
    
    if (!quadra_id || !data || !hora) {
      return res.status(400).json({ 
        success: false,
        error: "quadra_id, data e hora são obrigatórios" 
      });
    }

    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
      return res.status(400).json({ 
        success: false,
        error: "Formato de data inválido. Use YYYY-MM-DD" 
      });
    }

    // Validar formato da hora (HH:MM:SS)
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!timeRegex.test(hora)) {
      return res.status(400).json({ 
        success: false,
        error: "Formato de hora inválido. Use HH:MM:SS" 
      });
    }

    // Buscar reservas pendentes para a quadra, data e horário a partir do especificado
    const reservas = await reservaModel.getReservasPendentesAPartirDe(quadra_id, data, hora);
    
    // Formatar a resposta
    const reservasFormatadas = reservas.map(reserva => ({
      id: reserva.id,
      data: reserva.data,
      horario: {
        inicio: reserva.hora_inicio,
        fim: reserva.hora_fim
      },
      subquadra: {
        id: reserva.subquadra_id,
        nome: reserva.subquadra_nome
      },
      quadra: {
        id: reserva.quadra_id,
        nome: reserva.quadra_nome
      },
      cliente: {
        nome: reserva.cliente_nome,
        telefone: reserva.cliente_telefone
      },
      status: reserva.status,
      status_pagamento: reserva.status_pagamento,
      preco: reserva.preco,
      token: reserva.token
    }));

    res.json({
      success: true,
      total_reservas: reservas.length,
      reservas: reservasFormatadas
    });

  } catch (error) {
    console.error("Erro ao buscar reservas pendentes:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao buscar reservas pendentes",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Nova função para adicionar minutos específicos
function addMinutos(hora, minutosParaAdicionar) {
  let [h, m] = hora.split(":").map(Number);
  
  m += minutosParaAdicionar;
  if (m >= 60) {
    h += Math.floor(m / 60);
    m = m % 60;
  }
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

// Função auxiliar atualizada para suportar minutos
function addHora(hora, horasParaAdicionar, minutosParaAdicionar = 0) {
  let [h, m] = hora.split(":").map(Number);
  
  // Adiciona minutos primeiro
  m += minutosParaAdicionar;
  if (m >= 60) {
    h += Math.floor(m / 60);
    m = m % 60;
  }
  
  // Adiciona horas
  h += horasParaAdicionar;
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

// Buscar todas as reservas por quadra_id
export const getReservasPorQuadra = async (req, res) => {
  try {
    const { quadra_id } = req.query;
    
    if (!quadra_id) {
      return res.status(400).json({ error: "quadra_id é obrigatório" });
    }

    const reservas = await reservaModel.getReservasPorQuadra(quadra_id);
    
    // Formatar a resposta
    const reservasFormatadas = reservas.map(reserva => ({
      id: reserva.id,
      data: reserva.data,
      horario: {
        inicio: reserva.hora_inicio,
        fim: reserva.hora_fim
      },
      subquadra: {
        id: reserva.subquadra_id,
        nome: reserva.subquadra_nome
      },
      quadra: {
        id: reserva.quadra_id,
        nome: reserva.quadra_nome
      },
      cliente: {
        nome: reserva.cliente_nome,
        telefone: reserva.cliente_telefone
      },
      status: reserva.status,
      status_pagamento: reserva.status_pagamento,
      preco: reserva.preco,
      token: reserva.token
    }));

    res.json({
      success: true,
      total_reservas: reservas.length,
      reservas: reservasFormatadas
    });

  } catch (error) {
    console.error("Erro ao buscar reservas por quadra:", error);
    res.status(500).json({ 
      error: "Erro interno ao buscar reservas",
      detalhes: error.message 
    });
  }
};

// controllers/reservaController.js

// Cancelar reserva específica (com verificação de conflito)
export const cancelarReservaEspecifica = async (req, res) => {
  const { id } = req.query;
  try {
    const resultado = await reservaModel.cancelarReserva(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada.' });
    }

    res.json({ message: 'Reserva cancelada com sucesso.' });
  } catch (err) {
    console.error('Erro ao cancelar reserva:', err);
    res.status(500).json({ error: 'Erro ao cancelar reserva.' });
  }
};

// Criar reserva manual (admin)
export const criarReservaManual = async (req, res) => {
  try {
    const {
      subquadra_id,
      quadra_id,
      data,
      hora_inicio,
      hora_fim,
      cliente_nome,
      cliente_telefone,
      cliente_cpf,
      preco,
      status_pagamento
    } = req.body;

    if (!subquadra_id || !quadra_id || !data || !hora_inicio || !hora_fim || !cliente_nome || !cliente_telefone) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Verificar conflito
    const conflito = await reservaModel.verificarConflito(subquadra_id, data, hora_inicio, hora_fim);
    if (conflito) {
      return res.status(401).json({ error: "Já existe uma reserva nesse horário" });
    }

    // Gerar token único
    const token = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await reservaModel.criarReserva({
      subquadra_id,
      quadra_id,
      data,
      hora_inicio,
      hora_fim,
      cliente_nome,
      cliente_telefone,
      cliente_cpf,
      preco,
      status: 'confirmado', // Reservas manuais são confirmadas automaticamente
      status_pagamento,
      token
    });

    res.status(201).json({ 
      message: "Reserva criada com sucesso",
      token: token
    });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    res.status(500).json({ error: "Erro interno ao criar reserva" });
  }
};

// Relatórios de reservas
export const getRelatoriosReservas = async (req, res) => {
  try {
    const { quadra_id, subquadra_id, periodo, data_inicio, data_fim, ano, mes } = req.query;
    
    if (!quadra_id) {
      return res.status(400).json({ 
        success: false,
        error: "quadra_id é obrigatório" 
      });
    }

    let relatorio;
    
    switch (periodo) {
      case 'dia':
        if (!data_inicio) {
          return res.status(400).json({ error: "data_inicio é obrigatório para período 'dia'" });
        }
        relatorio = await reservaModel.getRelatorioDiario(quadra_id, subquadra_id, data_inicio);
        break;
      
      case 'semana':
        if (!data_inicio) {
          return res.status(400).json({ error: "data_inicio é obrigatório para período 'semana'" });
        }
        relatorio = await reservaModel.getRelatorioSemanal(quadra_id, subquadra_id, data_inicio);
        break;
      
      case 'quinzena':
        if (!data_inicio) {
          return res.status(400).json({ error: "data_inicio é obrigatório para período 'quinzena'" });
        }
        relatorio = await reservaModel.getRelatorioQuinzenal(quadra_id, subquadra_id, data_inicio);
        break;
      
      case 'mes':
        if (!ano || !mes) {
          return res.status(400).json({ error: "ano e mes são obrigatórios para período 'mes'" });
        }
        relatorio = await reservaModel.getRelatorioMensal(quadra_id, subquadra_id, ano, mes);
        break;
      
      case 'ano':
        if (!ano) {
          return res.status(400).json({ error: "ano é obrigatório para período 'ano'" });
        }
        relatorio = await reservaModel.getRelatorioAnual(quadra_id, subquadra_id, ano);
        break;
      
      case 'personalizado':
        if (!data_inicio || !data_fim) {
          return res.status(400).json({ error: "data_inicio e data_fim são obrigatórios para período 'personalizado'" });
        }
        relatorio = await reservaModel.getRelatorioPersonalizado(quadra_id, subquadra_id, data_inicio, data_fim);
        break;
      
      default:
        return res.status(400).json({ 
          success: false,
          error: "Período inválido. Use: dia, semana, quinzena, mes, ano ou personalizado" 
        });
    }

    res.json({
      success: true,
      periodo: periodo,
      filtros: {
        quadra_id,
        subquadra_id: subquadra_id || 'todas',
        data_inicio,
        data_fim,
        ano,
        mes
      },
      relatorio: relatorio
    });

  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao gerar relatório",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Estatísticas resumidas
export const getEstatisticasReservas = async (req, res) => {
  try {
    const { quadra_id, subquadra_id } = req.query;
    
    if (!quadra_id) {
      return res.status(400).json({ 
        success: false,
        error: "quadra_id é obrigatório" 
      });
    }

    const estatisticas = await reservaModel.getEstatisticasReservas(quadra_id, subquadra_id);
    
    res.json({
      success: true,
      estatisticas: estatisticas
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao buscar estatísticas",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// controllers/reservaController.js
export const getReservaPorToken = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: "Token é obrigatório" });
    }

    console.log('Buscando reserva para token:', token); // Log para debug
    
    const reserva = await reservaModel.getReservaCompletaPorToken(token);
    
    console.log('Resposta do banco:', reserva); // Log para debug
    
    if (!reserva) {
      return res.status(404).json({ 
        success: false,
        error: "Reserva não encontrada",
        token_procurado: token // Mostra o token que foi procurado
      });
    }

    // Retorno simplificado com apenas os dados básicos
    res.json({
      success: true,
      reserva: {
        id: reserva.id,
        data: reserva.data, // Retorna no formato do banco (YYYY-MM-DD)
        hora_inicio: reserva.hora_inicio,
        hora_fim: reserva.hora_fim,
        subquadra_id: reserva.subquadra_id,
        quadra_id: reserva.quadra_id,
        cliente_nome: reserva.cliente_nome,
        cliente_telefone: reserva.cliente_telefone,
        status: reserva.status,
        status_pagamento: reserva.status_pagamento,
        preco: reserva.preco,
        criado_em: reserva.criado_em, // Retorna no formato do banco
        token: reserva.token
      }
    });

  } catch (error) {
    console.error("Erro detalhado ao buscar reserva:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao buscar reserva",
      detalhes: error.message 
    });
  }
};

export const cancelarReserva = async (req, res) => {
  const { id } = req.query;
  try {
    const resultado = await reservaModel.cancelarReserva(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada.' });
    }

    res.json({ message: 'Reserva cancelada com sucesso.' });
  } catch (err) {
    console.error('Erro ao cancelar reserva:', err);
    res.status(500).json({ error: 'Erro ao cancelar reserva.' });
  }
};

export const recusarReserva = async (req, res) => {
  const { id } = req.query;
  try {
    const resultado = await reservaModel.recusarReserva(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada.' });
    }

    res.json({ message: 'Reserva recusada com sucesso.' });
  } catch (err) {
    console.error('Erro ao cancelar reserva:', err);
    res.status(500).json({ error: 'Erro ao recusar reserva.' });
  }
};

export const confirmarReserva = async (req, res) => {
  const { id } = req.query;
  try {
    const resultado = await reservaModel.confirmarReserva(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada.' });
    }

    res.json({ message: 'Reserva confirmada com sucesso.' });
  } catch (err) {
    console.error('Erro ao confirmar reserva:', err);
    res.status(500).json({ error: 'Erro ao confirmar reserva.' });
  }
};

// Buscar reservas por telefone do cliente
export const getReservasPorTelefone = async (req, res) => {
  try {
    const { telefone } = req.query;
    
    if (!telefone) {
      return res.status(400).json({ error: "Número de telefone é obrigatório" });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    const reservas = await reservaModel.getReservasPorTelefone(telefoneLimpo);
    
    const reservasFormatadas = reservas.map(reserva => {
      const dataFormatada = reserva.data 
        ? dayjs(reserva.data).tz('America/Sao_Paulo').format('DD/MM/YYYY')
        : null;
      
      const criadoEmFormatado = reserva.criado_em 
        ? dayjs(reserva.criado_em).tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm:ss')
        : null;

      return {
        id: reserva.id,
        data: dataFormatada,
        horario: `${reserva.hora_inicio} - ${reserva.hora_fim}`,
        quadra: reserva.quadra_nome,
        subquadra: reserva.subquadra_nome,
        status: reserva.status,
        status_pagamento: reserva.status_pagamento,
        preco: reserva.preco,
        quadra_id: reserva.quadra_id,
        criado_em: criadoEmFormatado,
        cliente: {
          nome: reserva.cliente_nome,
          telefone: reserva.cliente_telefone,
          cpf: reserva.cliente_cpf
        }
      };
    });

    res.json({
      success: true,
      total_reservas: reservasFormatadas.length,
      reservas: reservasFormatadas
    });

  } catch (error) {
    console.error("Erro ao buscar reservas por telefone:", error);
    res.status(500).json({ 
      error: "Erro interno ao buscar reservas",
      detalhes: error.message 
    });
  }
};


export const enviarConfirmacao = async (req, res) => {
  const { token, destinatario, mensagem } = req.body;

  // Validações iniciais
  if (!token) {
    return res.status(400).json({ error: "Token é obrigatório" });
  }

  if (!['cliente', 'gerente'].includes(destinatario)) {
    return res.status(400).json({ error: "Destinatário inválido (use 'cliente' ou 'gerente')" });
  }

  try {
    // Busca a reserva
    const reserva = await reservaModel.getReservaPorToken(token);
    if (!reserva) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // Determina os telefones de destino
    let telefonesDestino = [];
    let tipoDestinatario;
    
    if (destinatario === 'cliente') {
      const telefoneCliente = reserva.cliente_telefone; // CORREÇÃO: usar cliente_telefone
      tipoDestinatario = 'Cliente';
      
      if (!telefoneCliente) {
        return res.status(400).json({ error: "Telefone não encontrado na reserva" });
      }
      telefonesDestino.push(telefoneCliente);
    } else {
      tipoDestinatario = 'Gerente';
      
      // Busca todos os administradores da quadra
      const admins = await adminModel.getAdminsByQuadraId(reserva.quadra_id);
      
      if (!admins || admins.length === 0) {
        return res.status(400).json({ error: "Nenhum administrador encontrado para esta quadra" });
      }
      
      // Filtra apenas admins com telefone válido
      telefonesDestino = admins
        .filter(admin => admin.telefone && admin.telefone.trim() !== '')
        .map(admin => admin.telefone);
      
      if (telefonesDestino.length === 0) {
        return res.status(400).json({ error: "Nenhum telefone de administrador encontrado" });
      }
    }

    // Verifica webhook
    if (!reserva.quadra_webhook) {
      return res.status(400).json({ error: "Quadra não possui webhook configurado" });
    }

    // Envia mensagem para cada telefone de destino
    const resultadosEnvio = [];
    
    for (const telefoneDestino of telefonesDestino) {
      const payload = {
        reserva_id: reserva.id,
        quadra: {
          id: reserva.quadra_id,
          nome: reserva.quadra_nome,
          telefone: reserva.quadra_telefone,
          slug: reserva.quadra_slug
        },
        subquadra: {
          id: reserva.subquadra_id,
          nome: reserva.subquadra_nome
        },
        cliente: {
          nome: reserva.cliente_nome,
          telefone: reserva.cliente_telefone, // CORREÇÃO: usar cliente_telefone
          cpf: reserva.cliente_cpf
        },
        data: dayjs(reserva.data).tz('America/Sao_Paulo').format('DD/MM/YYYY'),
        horario: `${reserva.hora_inicio} - ${reserva.hora_fim}`,
        preco: reserva.preco,
        status: reserva.status,
        status_pagamento: reserva.status_pagamento,
        data_criacao: dayjs(reserva.criado_em).tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm:ss'),
        token: reserva.token,
        destinatario: tipoDestinatario,
        telefone_destino: telefoneDestino,
        mensagem: mensagem || null
      };

      try {
        await axios.post(reserva.quadra_webhook, payload);
        resultadosEnvio.push({
          telefone: telefoneDestino,
          status: 'sucesso',
          mensagem: `Mensagem enviada para ${tipoDestinatario}`
        });
        console.log(`Mensagem enviada para ${tipoDestinatario} (${telefoneDestino})`);
        
        // Pequeno delay entre envios (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        resultadosEnvio.push({
          telefone: telefoneDestino,
          status: 'erro',
          mensagem: `Falha no envio: ${error.message}`
        });
        console.error(`Falha no envio para ${telefoneDestino}:`, error.message);
      }
    }

    // Verifica se houve algum envio bem-sucedido
    const enviosBemSucedidos = resultadosEnvio.filter(result => result.status === 'sucesso');
    
    if (enviosBemSucedidos.length === 0) {
      return res.status(500).json({
        error: "Falha em todos os envios",
        detalhes: resultadosEnvio
      });
    }

    // Resposta de sucesso
    return res.json({
      success: true,
      destinatario: tipoDestinatario,
      total_telefones: telefonesDestino.length,
      envios_bem_sucedidos: enviosBemSucedidos.length,
      envios_com_erro: resultadosEnvio.length - enviosBemSucedidos.length,
      resultados: resultadosEnvio,
      reserva_id: reserva.id,
      quadra_id: reserva.quadra_id,
      mensagem_enviada: Boolean(mensagem)
    });

  } catch (error) {
    console.error("Erro no processo:", error);
    return res.status(500).json({
      error: "Erro interno no servidor",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const createReserva = async (req, res) => {
  try {
    const {
      subquadra_id,
      quadra_id,
      data,
      hora_inicio,
      hora_fim,
      cliente_nome,
      cliente_telefone,
      cliente_cpf,
      preco,
      status,
      status_pagamento,
      token
    } = req.body;

    if (!subquadra_id || !quadra_id || !data || !hora_inicio || !hora_fim || !cliente_nome || !cliente_telefone || !token) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Validar se o intervalo é exatamente de 1 hora
    const inicioMinutos = formatarHoraParaMinutos(hora_inicio);
    const fimMinutos = formatarHoraParaMinutos(hora_fim);
    
    if (fimMinutos - inicioMinutos !== 60) {
      return res.status(400).json({ error: "O intervalo da reserva deve ser exatamente de 1 hora" });
    }

    const conflito = await reservaModel.verificarConflito(subquadra_id, data, hora_inicio, hora_fim);
    if (conflito) {
      return res.status(401).json({ error: "Já existe uma reserva nesse horário" });
    }

    await reservaModel.criarReserva({
      subquadra_id,
      quadra_id,
      data,
      hora_inicio,
      hora_fim,
      cliente_nome,
      cliente_telefone,
      cliente_cpf,
      preco,
      status,
      status_pagamento,
      token
    });

    res.status(201).json({ message: "Reserva criada com sucesso" });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    res.status(500).json({ error: "Erro interno ao criar reserva" });
  }
};

export const getHorariosLivres = async (req, res) => {
  try {
    const { quadra_id, data, horas = 1 } = req.query;

    if (!quadra_id || !data) {
      return res.status(400).json({ error: "quadra_id e data são obrigatórios" });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
      return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD" });
    }

    const horasInt = parseInt(horas);
    if (horasInt < 1 || horasInt > 4) {
      return res.status(400).json({ error: "Horas devem ser entre 1 e 4" });
    }

    const diaSemanaNumero = dayjs(data).day() || 7;
    const diaSemanaStr = diasSemanaMap[diaSemanaNumero];

    const horarioQuadra = await reservaModel.getHorarioFuncionamentoQuadraPrincipal(quadra_id, diaSemanaStr);
    if (!horarioQuadra) {
      return res.json({ quadra_id, data, message: 'Quadra não funciona neste dia', horarios: [] });
    }

    const horaAbertura = horarioQuadra.hora_inicio;
    const horaFechamento = horarioQuadra.hora_fim;

    // CORREÇÃO: Converter "00:00:00" para "24:00:00" para facilitar o cálculo
    const horaFechamentoAjustada = horaFechamento === '00:00:00' ? '24:00:00' : horaFechamento;

    const subquadras = await reservaModel.getSubquadrasPorQuadra(quadra_id);
    if (!subquadras || subquadras.length === 0) {
      return res.json({ quadra_id, data, message: 'Nenhuma subquadra encontrada', horarios: [] });
    }

    const resultado = await Promise.all(subquadras.map(async (subquadra) => {
      try {
        // Buscar reservas normais
        const reservas = await reservaModel.getReservasPorSubquadraEData(subquadra.id, data);
        const reservasOcupadas = reservas.filter(r => r.status === 'pendente' || r.status === 'confirmado');

        // Buscar reservas fixas
        const reservasFixas = await reservaModel.getReservasFixasPorSubquadraEDia(subquadra.id, diaSemanaStr);

        // Unir reservas normais + fixas
        const todasReservas = reservasOcupadas.concat(reservasFixas);

        let horariosLivres = [];

        // Converter horários para minutos (usando a hora fechamento ajustada)
        const [aberturaH, aberturaM] = horaAbertura.split(':').map(Number);
        const [fechamentoH, fechamentoM] = horaFechamentoAjustada.split(':').map(Number);

        const aberturaMinutos = aberturaH * 60 + aberturaM;
        // CORREÇÃO: Se for 24:00, converter para 1440 minutos (24*60)
        const fechamentoMinutos = fechamentoH === 24 ? 1440 : fechamentoH * 60 + fechamentoM;
        const duracaoMinutos = horasInt * 60;

        // Gerar slots de 30 em 30 minutos
        for (let minutoAtual = aberturaMinutos; minutoAtual <= fechamentoMinutos - duracaoMinutos; minutoAtual += 30) {
          const horaInicioMinutos = minutoAtual;
          const horaFimMinutos = minutoAtual + duracaoMinutos;

          const horaInicioFormatada = formatarMinutosParaHora(horaInicioMinutos);
          // CORREÇÃO: Converter 1440 minutos de volta para "00:00" se necessário
          let horaFimFormatada = formatarMinutosParaHora(horaFimMinutos);
          if (horaFimFormatada === '24:00') {
            horaFimFormatada = '00:00';
          }

          // Verificar conflito com todas as reservas
          const conflito = todasReservas.some(reserva => {
            const reservaInicioMinutos = formatarHoraParaMinutos(reserva.hora_inicio);
            let reservaFimMinutos = formatarHoraParaMinutos(reserva.hora_fim);
            
            // Ajustar para reservas que terminam à meia-noite
            if (reserva.hora_fim === '00:00') {
              reservaFimMinutos = 1440; // 24:00 em minutos
            }
            
            return horaInicioMinutos < reservaFimMinutos && horaFimMinutos > reservaInicioMinutos;
          });

          if (!conflito) {
            horariosLivres.push({ 
              inicio: horaInicioFormatada, 
              fim: horaFimFormatada, 
              duracao: horasInt 
            });
          }
        }

        return {
          subquadra_id: subquadra.id,
          subquadra_nome: subquadra.nome,
          horarios_livres: horariosLivres,
          total_horarios: horariosLivres.length,
          duracao: horasInt
        };
      } catch (error) {
        console.error(`Erro ao processar subquadra ${subquadra.id}:`, error);
        return {
          subquadra_id: subquadra.id,
          subquadra_nome: subquadra.nome,
          horarios_livres: [],
          total_horarios: 0,
          error: "Erro ao buscar horários"
        };
      }
    }));

    res.json({
      success: true,
      quadra_id,
      data,
      horas: horasInt,
      horario_quadra: { 
        abertura: horaAbertura, 
        fechamento: horaFechamento // Mantém o formato original
      },
      horarios: resultado
    });

  } catch (error) {
    console.error("Erro ao buscar horários livres:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao buscar horários livres",
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Funções auxiliares necessárias
function formatarMinutosParaHora(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  // Se for 24:00, retornar como 24:00 (será convertido para 00:00 depois)
  if (horas === 24 && mins === 0) {
    return '24:00';
  }
  
  // Converter 1440 minutos (24:00) para 00:00
  const horasAjustadas = horas >= 24 ? horas - 24 : horas;
  return `${horasAjustadas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatarHoraParaMinutos(hora) {
  const [horas, minutos] = hora.split(':').map(Number);
  
  // Se for "00:00" e quisermos representar como 24:00 para cálculos
  if (horas === 0 && minutos === 0) {
    return 1440; // 24:00 em minutos
  }
  
  return horas * 60 + minutos;
}

// Buscar apenas o horário de funcionamento
export const getHorarioFuncionamento = async (req, res) => {
  try {
    const { quadra_id } = req.query;
    if (!quadra_id) {
      return res.status(400).json({ error: "quadra_id é obrigatório" });
    }

    const diaSemanaNumero = dayjs().day() || 7;
    const diaSemanaStr = diasSemanaMap[diaSemanaNumero];

    const funcionamento = await reservaModel.getHorarioFuncionamentoQuadra(quadra_id, diaSemanaStr);
    if (!funcionamento) {
      return res.status(404).json({ error: "Quadra não encontrada ou fechada hoje" });
    }

    res.json(funcionamento);
  } catch (error) {
    console.error("Erro ao buscar horário de funcionamento:", error);
    res.status(500).json({ error: "Erro interno ao buscar horário de funcionamento" });
  }
};