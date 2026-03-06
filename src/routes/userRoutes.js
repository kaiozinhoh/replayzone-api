// routes/userRoutes.js
import express from 'express';
import * as userController from '../controller/userController.js';

const router = express.Router();

// Rota para login
router.post('/login', userController.loginUser);

// Rota para criar usuário
router.post('/register', userController.createUser);

// Rota para excluir um usuário
router.delete('/deleteuser/:id', userController.deleteUser);

// Rota para obter dados de um usuário
router.get('/getbyiduser/:id', userController.getUserById);

// Rota para atualizar dados de um usuário
router.put('/changeuser/:id', userController.updateUser);

// Rota para atualizar dados de um usuário
router.put('/changepassword/:id', userController.changePassword);

router.put('/changepasswordemail/:email', userController.changePasswordByEmail);

export default router;

