const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');

import { verifyActiveSession } from '../middleware';

router.post('/', userController.createUser);

// Aplica o middleware de sessão ativa para todas as rotas abaixo
router.use(verifyActiveSession);

router.put('/', userController.updateUser);
router.delete('/', userController.removeUser);
// router.get("/", verifyActiveSession, userController.showAllUsers);

module.exports = router;
