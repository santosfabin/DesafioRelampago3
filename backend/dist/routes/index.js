"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const { verifyActiveSession } = require('../middleware');
const router = (0, express_1.Router)();
const users = require("./users");
const login = require("./login");
const logout = require("./logout");
const asset = require("./asset");
router.use("/users", users);
router.use("/login", login);
// Aplica o middleware de sessão ativa para todas as rotas abaixo
router.use(verifyActiveSession);
router.use("/logout", logout);
router.use("/assets", asset);
exports.default = router;
