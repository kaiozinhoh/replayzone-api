// routes/videoRoutes.js - Adicione estas rotas
import express from 'express';
import * as videoController from '../controller/videoController.js';

const router = express.Router();

// Rota para buscar vídeos por subquadra_id, data e tipo
router.post('/subquadravideos', videoController.getVideosBySubquadraDateType);

// Rota para buscar um vídeo pelo ID
router.get('/videoid/:id', videoController.getVideoById);

// Rota para buscar vídeos por intervalo de 1 hora
router.post('/videos-hora', videoController.getVideosByHourInterval);

// NOVAS ROTAS PARA VÍDEOS AGRUPADOS
router.post('/videos-agrupados', videoController.getGroupedVideos);
router.post('/videos-agrupados-data', videoController.getGroupedVideosByDate);

export default router;