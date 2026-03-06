// routes/adminRoutes.js
import express from 'express';
import {
  loginAdmin,
  forgotAdminPassword,
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  updateAdminCargo,
  deleteAdmin,
  updateAdminPassword
} from '../controller/adminController.js';

const router = express.Router();

// Rotas existentes
router.post('/adminlogin', loginAdmin);
router.post('/admin-forgot-password', forgotAdminPassword);
router.post('/adminregister', createAdmin);

// NOVAS ROTAS ADICIONADAS:

// Listar todos os usuários/admin
router.get('/admins', getAllAdmins);

// Obter usuário específico por ID
router.get('/admins/:id', getAdminById);

// Atualizar dados do usuário (incluindo cargo)
router.put('/admins/:id', updateAdmin);

// Atualizar apenas o cargo do usuário
router.patch('/admins/:id/cargo', updateAdminCargo);

// Excluir usuário
router.delete('/admins/:id', deleteAdmin);

// Atualizar senha do usuário (por admin)
router.put('/admins/:id/password', updateAdminPassword);

export default router;