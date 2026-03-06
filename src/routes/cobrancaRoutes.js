import express from 'express';
import * as cobrancaController from '../controller/cobrancasController.js';

const router = express.Router();

// Rotas de cobranças
router.get('/cobrancas', cobrancaController.getAllCobrancas);
router.get('/cobrancas/pendentes', cobrancaController.getCobrancasPendentes);
router.get('/cobrancas/cliente/:id', cobrancaController.getCobrancasByClienteId);
router.get('/cobrancas/:id', cobrancaController.getCobrancaById);               // ✅ CORRIGIDO
router.post('/cobrancas', cobrancaController.createCobranca);
router.post('/cobrancas/gerar-mensais', cobrancaController.gerarCobrancasMensais);
router.put('/cobrancas/:id', cobrancaController.updateCobranca);                // ✅ CORRIGIDO
router.delete('/cobrancas/:id', cobrancaController.deleteCobranca);             // ✅ CORRIGIDO
router.put('/cobrancas/:id/baixar', cobrancaController.darBaixaCobranca);
router.post('/cobrancas/:id/enviar-whatsapp', cobrancaController.enviarCobrancaWhatsApp);

export default router;
