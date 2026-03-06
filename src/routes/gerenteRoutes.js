// routes/gerenteRoutes.js
import express from 'express';
import * as gerenteController from '../controller/gerenteController.js';

const router = express.Router();

// Rota para criar um novo usuário
router.post('/usuarios', gerenteController.createUser);

// Rota para buscar usuários por quadra
router.get('/usuarios/quadra/:quadra_id', gerenteController.getUsersByQuadra);

// Rota para atualizar um usuário
router.put('/usuarios/:id', gerenteController.updateUser);

// Rota para excluir um usuário
router.delete('/usuarios/:id', gerenteController.deleteUser);

export default router; 