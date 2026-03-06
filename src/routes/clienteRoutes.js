// routes/clienteRoutes.js - Adicione estas rotas
import express from 'express';
import * as clienteController from '../controller/clienteController.js';

const router = express.Router();

// Rotas existentes...
router.post('/clientescriar', clienteController.createCliente);
router.get('/clientes', clienteController.getAllClientes);
router.get('/clientesbyid/:id', clienteController.getClienteById);
router.get('/clientesbywidepayid/:id', clienteController.getClienteByWidePayId);
router.get('/clientesinadimplentes/', clienteController.getClientesInadimplentes);
router.put('/clientesalterar/:id', clienteController.updateCliente);
router.delete('/clientesdeletar/:id', clienteController.deleteCliente);
router.put('/clientespago/:id', clienteController.marcarClienteDesbloqueado);
router.put('/clientesatrasado/:id', clienteController.marcarClienteAtrasado);
router.put('/clientespendente/:id', clienteController.marcarClientePendente);

// ✅ NOVAS ROTAS PARA N8N
router.get('/clientes-status-bloqueio', clienteController.getClientesComStatusBloqueio);
router.get('/clientes-status-bloqueio/:id', clienteController.getClienteComStatusBloqueio);
router.post('/webhook-status-bloqueio', clienteController.webhookStatusBloqueio);

export default router;