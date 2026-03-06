// routes/quadraRoutes.js
import express from 'express';
import * as quadraController from '../controller/quadraController.js';

const router = express.Router();

// Rota para obter todas as quadras
router.get('/quadras', quadraController.getAllQuadras);

// Rota para obter as quadras de um usuário
router.get('/quadrasuser/:usuario_id', quadraController.getQuadrasByUsuario);

router.get('/quadrabyid/:id', quadraController.getQuadraById);

// Rota para vincular o usuário à quadra
router.post('/vincular-usuario', quadraController.vincularUsuarioAQuadra);

// Rota para desvincular a quadra do usuário
router.delete('/deletequadra/:id', quadraController.desvincularUsuarioDeQuadra);

// Rota para criar uma nova quadra
router.post('/quadras', quadraController.createQuadra);

// Rota para atualizar uma quadra existente
router.put('/quadras/:id', quadraController.updateQuadra);

// Rota para reiniciar todos os streams HLS de uma quadra
router.post('/quadras/:quadra_id/restart-hls', quadraController.restartAllHlsStreams);

// Rota para reiniciar stream de uma subquadra específica
router.post('/subquadras/:sub_quadra_id/restart-hls', quadraController.restartHlsStream);

// Rota para obter horário de funcionamento
router.get('/horario-funcionamento/:quadra_id', quadraController.getHorarioFuncionamento);

// Rota para atualizar horário de funcionamento
router.put('/horario-funcionamento/:quadra_id', quadraController.updateHorarioFuncionamento);


// Rota para upload de logo de patrocinador
router.post('/upload-sponsor-logo', quadraController.uploadSponsorLogo);

// Rota para limpar logos não utilizadas
router.get('/cleanup-unused-logos', quadraController.cleanupUnusedLogos);

// ... (mantenha as outras rotas existentes)

// Rota para obter patrocinadores
router.get('/sponsors/:quadra_id', quadraController.getSponsors);

// Rota para atualizar patrocinadores
router.put('/sponsors/:quadra_id', quadraController.updateSponsors);

// Rota para gerar vídeo de teste
router.get('/generate-test-video/:quadra_id', quadraController.generateTestVideo);

// routes/quadraRoutes.js - Adicione estas rotas

// Rota para buscar quadra por slug
router.get('/quadras/slug/:slug', quadraController.getQuadraBySlug);

// Rota para gerar slugs para quadras existentes (uso único)
router.post('/quadras/generate-slugs', quadraController.generateSlugsForExistingQuadras);

export default router;
