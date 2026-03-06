// routes/authRoutes.js
import express from 'express';
import * as userAuthController from '../controller/userAuthController.js';

const router = express.Router();

// Rota para iniciar login com telefone
router.post('/phone-login', userAuthController.initPhoneLogin);

// Rota para verificar código
router.post('/verify-code', userAuthController.verifyCode);

export default router;