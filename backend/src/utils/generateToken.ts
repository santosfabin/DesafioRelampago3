import jwt from 'jsonwebtoken';
import config from '../config';

// Gera token COM PREFIXO "user:" NO PAYLOAD (ex: { user: 123 })
export const generateToken = (userId: number): string => {
  return jwt.sign(
    { user: userId }, // Payload: { user: ID_DIRETO }
    config.SECRET_KEY,
    { expiresIn: '10d' }
  );
};
