import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import config from '../config';
const userService = require('../services/userService');

const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Dados insuficientes' });
    }

    // Chama o service para validar e criar o usuário
    const result = await userService.createUser(name, email, password);

    if (result.error) {
      return res.status(400).json({ error: result });
    }

    res.cookie('session_id', result.sessionToken, {
      httpOnly: true,
      maxAge: 864000000,
    });

    return res.status(200).json(result.user);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { name, email, password } = req.body;

    if (!name && !email && !password) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const updatedFields: any = {};
    if (name) {
      updatedFields.name = name;
    }
    if (email) {
      updatedFields.email = email;
    }
    if (password) {
      updatedFields.password = password;
    }

    const result = await userService.updateUser(id, updatedFields);
    if (result.error) {
      return res.status(400).json({ error: result });
    }

    return res.status(200).json(result.user);
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({ error: 'Erro ao atualizar usuário.', message: error.message });
  }
};

const removeUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await userService.removeUser(id);
    if (result.error) {
      return res.status(400).json({ error: result });
    }

    res.cookie('session_id', '', { expires: new Date(0) });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({ error: 'Erro ao remover usuário.' });
  }
};

// const showAllUsers = async (req: Request, res: Response) => {
//   try {
//     const result = await userService.showAllUsers();
//     if (result.error) {
//       return res.status(400).json({ error: result });
//     }

//     return res.status(200).json(result);
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({ error: 'Erro ao buscar usuários.' });
//   }
// };

// module.exports = { createUser, updateUser, removeUser, showAllUsers };

module.exports = { createUser, updateUser, removeUser };
