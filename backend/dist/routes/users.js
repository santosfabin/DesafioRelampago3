"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const middleware_1 = require("../middleware");
router.post('/', userController.createUser);
// Aplica o middleware de sessão ativa para todas as rotas abaixo
router.use(middleware_1.verifyActiveSession);
router.put('/', userController.updateUser);
router.delete('/', userController.removeUser);
router.get("/", middleware_1.verifyActiveSession, userController.showOneUsers);
module.exports = router;
