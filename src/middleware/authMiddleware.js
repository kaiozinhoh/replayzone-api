// middleware/authMiddleware.js
import jwt from '../utils/jwt.js';
import * as userModel from '../models/userModel.js';

// Verificar token JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token de acesso não fornecido' 
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_jwt_secret_aqui');
    
    // Buscar usuário no banco
    const users = await userModel.getUserById(decoded.userId);
    
    if (!users || users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    // Adicionar usuário à requisição
    req.user = users[0];
    next();

  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expirado' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: 'Erro na autenticação' 
    });
  }
};

// Middleware para verificar se o usuário é admin
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.tipo !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Acesso restrito a administradores' 
    });
  }
  next();
};

// Middleware para verificar se o usuário é dono de quadra
export const requireQuadraOwner = (req, res, next) => {
  if (!req.user || !req.user.quadra_id) {
    return res.status(403).json({ 
      success: false, 
      error: 'Acesso restrito a proprietários de quadra' 
    });
  }
  next();
};

// Middleware para verificar se o usuário está ativo
export const requireActiveUser = (req, res, next) => {
  if (!req.user || req.user.status !== 'ativo') {
    return res.status(403).json({ 
      success: false, 
      error: 'Usuário inativo' 
    });
  }
  next();
};

// Middleware opcional - autentica se tiver token, mas não bloqueia
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_jwt_secret_aqui');
      const users = await userModel.getUserById(decoded.userId);
      
      if (users && users.length > 0) {
        req.user = users[0];
      }
    }
    
    next();
  } catch (error) {
    // Não bloqueia em caso de erro, apenas continua sem usuário
    next();
  }
};