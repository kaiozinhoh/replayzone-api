// utils/jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'Kaio@30052003';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90d';

// Criar token JWT
export const createToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  });
};

// Verificar token JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};

// Decodificar token sem verificar (útil para pegar informações)
export const decodeToken = (token) => {
  return jwt.decode(token);
};

// Renovar token (se expirou mas tem refresh token)
export const refreshToken = (oldToken) => {
  try {
    const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
    return createToken({ userId: decoded.userId });
  } catch (error) {
    throw new Error('Não foi possível renovar o token');
  }
};

export default {
  createToken,
  verifyToken,
  decodeToken,
  refreshToken
};