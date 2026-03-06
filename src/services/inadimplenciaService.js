// services/inadimplenciaService.js
import dayjs from 'dayjs';
import * as clienteModel from '../models/clienteModel.js';
import * as quadraModel from '../models/quadraModel.js';

export const verificarInadimplenciaEBlocarQuadras = async () => {
  const hoje = dayjs();
  const resultados = {
    clientesAtrasados: [],
    quadrasBloqueadas: [],
    quadrasDesbloqueadas: [],
    clientesBloqueados: [],
    clientesDesbloqueados: []
  };

  console.log(`[${hoje.format()}] 🔍 Iniciando verificação de inadimplência e bloqueio de quadras...`);

  try {
    const clientes = await clienteModel.getAllClientes();
    console.log(`📋 Total de clientes encontrados: ${clientes.length}`);

    for (const cliente of clientes) {
      if (!cliente.ultimo_pagamento || !cliente.vencimento_dia) {
        console.log(`⚠️ Cliente ${cliente.id} ignorado (dados incompletos).`);
        continue;
      }

      const dataUltimoPagamento = dayjs(cliente.ultimo_pagamento);
      const proximoVencimento = dataUltimoPagamento
        .add(1, 'month')
        .set('date', cliente.vencimento_dia)
        .startOf('day');

      const dataLimiteBloqueio = proximoVencimento.add(5, 'day');
      
      // ✅ CORREÇÃO: Cliente atrasado se:
      // 1. Data atual passou do vencimento (para status "Pago") OU
      // 2. Status é "Pendente" (cobrança gerada mas não paga)
      const clienteEstaAtrasado = 
        (hoje.isSame(proximoVencimento, 'day') || hoje.isAfter(proximoVencimento, 'day')) && 
        cliente.status_pagamento === 'Pago' || 
        cliente.status_pagamento === 'Pendente';
      
      const deveBloquearQuadra = clienteEstaAtrasado && hoje.isAfter(dataLimiteBloqueio, 'day');
      
      // ✅ CORREÇÃO: Cálculo correto dos dias para bloqueio
      let diasParaBloqueio;
      if (clienteEstaAtrasado) {
        if (cliente.status_pagamento === 'Pendente' && hoje.isBefore(proximoVencimento, 'day')) {
          // Cliente está com status "Pendente" mas ainda não venceu
          // Dias para bloqueio = dias até vencimento + 5
          diasParaBloqueio = proximoVencimento.diff(hoje, 'day') + 5;
        } else if (hoje.isBefore(dataLimiteBloqueio, 'day')) {
          // Ainda dentro dos 5 dias de tolerância
          diasParaBloqueio = dataLimiteBloqueio.diff(hoje, 'day');
        } else {
          // Já passou do limite de bloqueio - mostrar 0
          diasParaBloqueio = 0;
        }
      } else {
        // Cliente não está atrasado - calcular dias até o vencimento + 5 dias de tolerância
        diasParaBloqueio = proximoVencimento.diff(hoje, 'day') + 5;
      }

      const clienteEstaBloqueado = cliente.bloqueado === 'sim';

      console.log(`📊 Cliente ${cliente.nome} (ID: ${cliente.id}):`);
      console.log(`   - Último pagamento: ${dataUltimoPagamento.format('DD/MM/YYYY')}`);
      console.log(`   - Próximo vencimento: ${proximoVencimento.format('DD/MM/YYYY')}`);
      console.log(`   - Data limite bloqueio: ${dataLimiteBloqueio.format('DD/MM/YYYY')}`);
      console.log(`   - Hoje: ${hoje.format('DD/MM/YYYY')}`);
      console.log(`   - Status atual: ${cliente.status_pagamento}`);
      console.log(`   - Cliente atrasado: ${clienteEstaAtrasado}`);
      console.log(`   - Deve bloquear quadra: ${deveBloquearQuadra}`);
      console.log(`   - Dias para bloqueio: ${diasParaBloqueio}`);
      console.log(`   - Cliente bloqueado: ${clienteEstaBloqueado}`);

      // Buscar quadra do cliente
      let quadraDoCliente = null;
      if (cliente.quadra_id) {
        const quadras = await quadraModel.getQuadraById(cliente.quadra_id);
        if (quadras.length > 0) {
          quadraDoCliente = quadras[0];
        }
      }

      // ✅ CORREÇÃO: LÓGICA DE BLOQUEIO ATUALIZADA
      try {
        if (deveBloquearQuadra) {
          // Cliente deve ser bloqueado (atrasado há mais de 5 dias)
          if (!clienteEstaBloqueado) {
            await clienteModel.marcarClienteComoBloqueado(cliente.id);
            console.log(`🔒 CLIENTE BLOQUEADO: ${cliente.nome} (ID: ${cliente.id}) - Pagamento em atraso há mais de 5 dias`);
            resultados.clientesBloqueados.push({
              id: cliente.id,
              nome: cliente.nome,
              diasAtraso: hoje.diff(proximoVencimento, 'day')
            });
          }
          
          // Sempre atualizar dias para bloqueio como 0 quando deve bloquear
          await clienteModel.atualizarApenasDiasBloqueio(cliente.id, 0);
          
          // ✅ BLOQUEAR A QUADRA
          if (quadraDoCliente && quadraDoCliente.atrasado === 'nao') {
            try {
              await quadraModel.marcarQuadraComoAtrasada(quadraDoCliente.id);
              console.log(`🚨 QUADRA BLOQUEADA: ${quadraDoCliente.nome} (ID: ${quadraDoCliente.id}) - Cliente ${cliente.nome} em atraso`);
              resultados.quadrasBloqueadas.push({
                quadraId: quadraDoCliente.id,
                quadraNome: quadraDoCliente.nome,
                clienteId: cliente.id,
                clienteNome: cliente.nome,
                vencimento: proximoVencimento.format('DD/MM/YYYY'),
                diasAtraso: hoje.diff(proximoVencimento, 'day')
              });
            } catch (erroQuadra) {
              console.error(`❌ Erro ao bloquear quadra ${quadraDoCliente.id}:`, erroQuadra.message);
            }
          }
          
        } else if (clienteEstaAtrasado) {
          // Cliente está atrasado mas ainda dentro dos 5 dias
          // OU está com status "Pendente" mas ainda não venceu
          
          // Atualizar dias para bloqueio
          await clienteModel.atualizarApenasDiasBloqueio(cliente.id, diasParaBloqueio);
          
          if (cliente.status_pagamento === 'Pendente' && hoje.isBefore(proximoVencimento, 'day')) {
            console.log(`⏳ Cliente ${cliente.nome}: PENDENTE - ${diasParaBloqueio} dias até possível bloqueio`);
          } else if (diasParaBloqueio > 0) {
            console.log(`⚠️ Cliente ${cliente.nome}: ATRASADO - ${diasParaBloqueio} dias até o bloqueio`);
          } else if (diasParaBloqueio === 0) {
            console.log(`🚨 Cliente ${cliente.nome}: BLOQUEIO HOJE!`);
          }
          
          // Se cliente está bloqueado mas não deve mais estar (pagamento parcial?), desbloquear
          if (clienteEstaBloqueado && diasParaBloqueio > 0) {
            await clienteModel.marcarClienteComoDesbloqueado(cliente.id);
            console.log(`🔓 CLIENTE DESBLOQUEADO TEMPORARIAMENTE: ${cliente.nome} - Ainda em período de tolerância`);
          }
        } else {
          // Cliente está em dia - desbloquear se estava bloqueado
          if (clienteEstaBloqueado) {
            await clienteModel.marcarClienteComoDesbloqueado(cliente.id);
            console.log(`🔓 CLIENTE DESBLOQUEADO: ${cliente.nome} (ID: ${cliente.id}) - Pagamento regularizado`);
            resultados.clientesDesbloqueados.push({
              id: cliente.id,
              nome: cliente.nome
            });
          }
          
          // ✅ DESBLOQUEAR A QUADRA
          if (quadraDoCliente && quadraDoCliente.atrasado === 'sim') {
            try {
              await quadraModel.marcarQuadraComoEmDia(quadraDoCliente.id);
              console.log(`✅ QUADRA DESBLOQUEADA: ${quadraDoCliente.nome} (ID: ${quadraDoCliente.id}) - Cliente ${cliente.nome} regularizado`);
              resultados.quadrasDesbloqueadas.push({
                quadraId: quadraDoCliente.id,
                quadraNome: quadraDoCliente.nome,
                clienteId: cliente.id,
                clienteNome: cliente.nome
              });
            } catch (erroQuadra) {
              console.error(`❌ Erro ao desbloquear quadra ${quadraDoCliente.id}:`, erroQuadra.message);
            }
          }
          
          // Cliente em dia e não bloqueado - mostrar dias até próximo vencimento + 5
          await clienteModel.atualizarApenasDiasBloqueio(cliente.id, diasParaBloqueio);
          console.log(`✅ Cliente ${cliente.nome}: Em dia - ${diasParaBloqueio} dias até possível bloqueio`);
        }
      } catch (erroCliente) {
        console.error(`❌ Erro ao atualizar status do cliente ${cliente.id}:`, erroCliente.message);
      }

      // ✅ CORREÇÃO: ATUALIZAR STATUS PAGAMENTO CORRETAMENTE
      // Se cliente está atrasado e status é "Pago", mudar para "Atrasado"
      if (clienteEstaAtrasado && cliente.status_pagamento === 'Pago' && hoje.isAfter(proximoVencimento, 'day')) {
        try {
          await clienteModel.marcarClienteComoAtrasado(cliente.id);
          console.log(`📝 Cliente ${cliente.nome} marcado como ATRASADO (vencimento passou).`);
          resultados.clientesAtrasados.push({ id: cliente.id, nome: cliente.nome });
        } catch (erroUpdate) {
          console.error(`❌ Erro ao atualizar cliente ${cliente.id} para Atrasado:`, erroUpdate.message);
        }
      }
      // Se cliente não está atrasado e status é "Atrasado", mudar para "Pago"
      else if (!clienteEstaAtrasado && cliente.status_pagamento === 'Atrasado') {
        try {
          await clienteModel.marcarClienteComoPago(cliente.id);
          console.log(`🔄 Cliente ${cliente.nome} atualizado para PAGO (regularizado).`);
        } catch (erroUpdate) {
          console.error(`❌ Erro ao atualizar cliente ${cliente.id} para Pago:`, erroUpdate.message);
        }
      }
      // IMPORTANTE: Status "Pendente" é mantido pelo n8n quando gera cobrança
      // O sistema não muda automaticamente de "Pendente" para outro status
      // Apenas verifica se deve bloquear baseado no vencimento
    }

    console.log(`🏁 Verificação concluída.`);
    console.log(`📊 Resumo:`);
    console.log(`   👥 Clientes marcados como atrasados: ${resultados.clientesAtrasados.length}`);
    console.log(`   🔒 Quadras bloqueadas: ${resultados.quadrasBloqueadas.length}`);
    console.log(`   🔓 Quadras desbloqueadas: ${resultados.quadrasDesbloqueadas.length}`);
    console.log(`   🔐 Clientes bloqueados: ${resultados.clientesBloqueados.length}`);
    console.log(`   🔓 Clientes desbloqueados: ${resultados.clientesDesbloqueados.length}`);

  } catch (erroGeral) {
    console.error(`❌ Erro geral durante verificação:`, erroGeral.message);
  }

  return resultados;
};

export const verificarStatusCliente = async (clienteId) => {
  try {
    const clientes = await clienteModel.getClienteById(clienteId);
    
    if (clientes.length === 0) {
      return { error: 'Cliente não encontrado' };
    }

    const cliente = clientes[0];
    const hoje = dayjs();
    const dataUltimoPagamento = dayjs(cliente.ultimo_pagamento);
    const proximoVencimento = dataUltimoPagamento
      .add(1, 'month')
      .set('date', cliente.vencimento_dia)
      .startOf('day');
    
    const dataLimiteBloqueio = proximoVencimento.add(5, 'day');
    
    // ✅ CORREÇÃO: Mesma lógica do serviço principal
    const clienteEstaAtrasado = 
      (hoje.isSame(proximoVencimento, 'day') || hoje.isAfter(proximoVencimento, 'day')) && 
      cliente.status_pagamento === 'Pago' || 
      cliente.status_pagamento === 'Pendente';
    
    const deveBloquearQuadra = clienteEstaAtrasado && hoje.isAfter(dataLimiteBloqueio, 'day');
    
    // ✅ CORREÇÃO: Mesma lógica do serviço principal
    let diasParaBloqueio;
    if (clienteEstaAtrasado) {
      if (cliente.status_pagamento === 'Pendente' && hoje.isBefore(proximoVencimento, 'day')) {
        diasParaBloqueio = proximoVencimento.diff(hoje, 'day') + 5;
      } else if (hoje.isBefore(dataLimiteBloqueio, 'day')) {
        diasParaBloqueio = dataLimiteBloqueio.diff(hoje, 'day');
      } else {
        diasParaBloqueio = 0;
      }
    } else {
      diasParaBloqueio = proximoVencimento.diff(hoje, 'day') + 5;
    }
    
    return {
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      statusAtual: cliente.status_pagamento,
      ultimoPagamento: cliente.ultimo_pagamento,
      proximoVencimento: proximoVencimento.format('DD/MM/YYYY'),
      dataLimiteBloqueio: dataLimiteBloqueio.format('DD/MM/YYYY'),
      hoje: hoje.format('DD/MM/YYYY'),
      clienteEstaAtrasado,
      deveBloquearQuadra,
      diasParaBloqueio: Math.max(0, diasParaBloqueio), // Nunca negativo
      clienteBloqueado: cliente.bloqueado === 'sim',
      quadraId: cliente.quadra_id,
      diasAposVencimento: Math.max(0, hoje.diff(proximoVencimento, 'day'))
    };
  } catch (error) {
    console.error('Erro ao verificar status do cliente:', error);
    return { error: 'Erro ao verificar status do cliente' };
  }
};