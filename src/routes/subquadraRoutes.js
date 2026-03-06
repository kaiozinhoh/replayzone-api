// routes/subquadraRoutes.js
import express from 'express';
import * as subquadraController from '../controller/subquadraController.js';

const router = express.Router();
// Rota para obter todas as subquadras
router.get('/allsubquadras', subquadraController.getAllSubQuadras);
// Rota para obter subquadras associadas a uma quadra
router.get('/subquadras/:quadra_id', subquadraController.getSubquadrasByQuadra);

// Rota para obter subquadras detalhadas de uma quadra (com contagem de vídeos)
router.get('/subquadras/detalhadas/:quadra_id', subquadraController.getSubquadrasDetalhadas);

// Rota para buscar uma subquadra específica pelo ID
router.get('/subquadraid/:id', subquadraController.getSubquadraById);

// Rota para buscar todos os vídeos de uma subquadra
router.get('/subquadras/videos/:subquadra_id', subquadraController.getVideosBySubquadra);

// Rota para criar uma nova subquadra
router.post('/subquadras', subquadraController.createSubquadra);

// Rota para atualizar uma subquadra existente
router.put('/subquadras/:id', subquadraController.updateSubquadra);

// Novas rotas para buscar por slug da quadra
router.get('/subquadras/slug/:quadraSlug', subquadraController.getSubquadrasByQuadraSlug);
router.get('/subquadras/detalhadas/slug/:quadraSlug', subquadraController.getSubquadrasDetalhadasBySlug);

export default router;
