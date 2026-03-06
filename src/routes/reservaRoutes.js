import express from 'express';
import * as reservaController from '../controller/reservaController.js';


const router = express.Router();

// Rota para buscar horários livres das subquadras numa quadra em um dia
router.get('/horarios-livres', reservaController.getHorariosLivres);

router.get('/horario-funcionamento', reservaController.getHorarioFuncionamento);

// POST - Criar nova reserva
router.post('/reservas', reservaController.createReserva);


router.get('/reservasportelefone', reservaController.getReservasPorTelefone);

router.get('/reservasporquadra', reservaController.getReservasPorQuadra);

router.get('/reservasportoken', reservaController.getReservaPorToken);

router.get('/reservas-por-data', reservaController.getReservasPorQuadraEData);

router.get('/cancelarreserva', reservaController.cancelarReserva);

router.get('/recusarreserva', reservaController.recusarReserva);

router.get('/confirmarreserva', reservaController.confirmarReserva);
//confirmação e recusar tambem
router.post('/enviarconfirmacao', reservaController.enviarConfirmacao);

router.get('/reservas-pendentes', reservaController.getReservasPendentesAPartirDe);

// Adicione estas rotas:
router.get('/cancelar-reserva-especifica', reservaController.cancelarReservaEspecifica);
router.post('/reserva-manual', reservaController.criarReservaManual);

// Relatórios
router.get('/relatorios', reservaController.getRelatoriosReservas);
router.get('/estatisticas', reservaController.getEstatisticasReservas);

// Rotas para reservas fixas
router.get('/reservas-fixas', reservaController.getReservasFixas);
router.post('/reservas-fixas', reservaController.criarReservaFixa);
router.delete('/reservas-fixas', reservaController.excluirReservaFixa);
router.post('/gerar-reservas-fixas', reservaController.gerarReservasFromFixas);


export default router;
