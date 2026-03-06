// financeiro/verificaInadimplencia.js
import { verificarInadimplenciaEBlocarQuadras } from '../services/inadimplenciaService.js';

// Mantém compatibilidade com código existente
export const verificarInadimplencia = async () => {
  console.log('🔄 Usando novo sistema de verificação com bloqueio de quadras...');
  
  const resultados = await verificarInadimplenciaEBlocarQuadras();
  
  // Retorna apenas os clientes atrasados para manter compatibilidade
  return resultados.clientesAtrasados;
};

// Exporta também a nova função
export { verificarInadimplenciaEBlocarQuadras };