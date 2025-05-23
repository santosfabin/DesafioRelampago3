import express from 'express';
const router = express.Router();

const logoutController = require('../controller/logoutController');
const { verifyActiveSession } = require('../middleware');

// Aplica o middleware de sessão ativa para todas as rotas abaixo
router.use(verifyActiveSession);

router.delete('/', logoutController.logout);

module.exports = router;
