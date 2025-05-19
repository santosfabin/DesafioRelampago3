import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';

export const authorizeUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const token = req.cookies.session_id;

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, config.SECRET_KEY) as JwtPayload;
    console.log(decoded.user);
    console.log(id);

    if (decoded.user !==id) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Se chegou aqui, está autorizado
    next();
  } catch (error: any) {
    console.error(error);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
