// financeiro/cobranca.js
import cron from 'node-cron';
import { verificarInadimplenciaEBlocarQuadras } from '../services/inadimplenciaService.js';

cron.schedule('0 2 * * *', async () => {
  console.log(`[${new Date().toISOString()}] 🔍 Verificação de inadimplência COM BLOQUEIO (CRON) iniciada...`);
  try {
    const resultados = await verificarInadimplenciaEBlocarQuadras();
    
    console.log(`📊 Verificação concluída:`);
    console.log(`   👥 ${resultados.clientesAtrasados.length} cliente(s) marcados como atrasados`);
    console.log(`   🔒 ${resultados.quadrasBloqueadas.length} quadra(s) bloqueada(s)`);
    console.log(`   🔓 ${resultados.quadrasDesbloqueadas.length} quadra(s) desbloqueada(s)`);
    
  } catch (error) {
    console.error('❌ Erro durante verificação de inadimplência:', error.message);
  }
});

console.log('✅ Agendador de inadimplência COM BLOQUEIO iniciado (todos os dias às 02:00)');