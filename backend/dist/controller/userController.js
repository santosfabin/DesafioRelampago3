"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const getUserIdFromToken_1 = require("../utils/getUserIdFromToken");
const userService = require('../services/userService');
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Dados insuficientes' });
        }
        const result = yield userService.createUser(name, email, password);
        if (result.error) {
            return res.status(400).json({ error: result });
        }
        res.cookie('session_id', result.sessionToken, {
            httpOnly: true,
            maxAge: 864000000,
        });
        return res.status(200).json(result.user);
    }
    catch (e) {
        return res.status(400).json({ error: e.message });
    }
});
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.session_id;
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const id = (0, getUserIdFromToken_1.getUserIdFromToken)(token);
        if (!id)
            return res.status(401).json({ error: 'Token inválido' });
        const { name, email, password } = req.body;
        if (!name && !email && !password) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }
        const updatedFields = {};
        if (name) {
            updatedFields.name = name;
        }
        if (email) {
            updatedFields.email = email;
        }
        if (password) {
            updatedFields.password = password;
        }
        const result = yield userService.updateUser(id, updatedFields);
        if (result.error) {
            return res.status(400).json({ error: result });
        }
        return res.status(200).json(result.user);
    }
    catch (error) {
        console.error('Console.erro', error);
        return res.status(400).json({ error: 'Erro ao atualizar usuário.', message: error.message });
    }
});
const removeUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.session_id;
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const id = (0, getUserIdFromToken_1.getUserIdFromToken)(token);
        if (!id)
            return res.status(401).json({ error: 'Token inválido' });
        const result = yield userService.removeUser(id);
        if (result.error) {
            return res.status(400).json({ error: result });
        }
        res.cookie('session_id', '', { expires: new Date(0) });
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Console.erro', error);
        return res.status(400).json({ error: 'Erro ao remover usuário.' });
    }
});
const showOneUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.session_id;
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const id = (0, getUserIdFromToken_1.getUserIdFromToken)(token);
        if (!id)
            return res.status(401).json({ error: 'Token inválido' });
        const result = yield userService.showOneUsers(id);
        if (result.error) {
            return res.status(400).json({ error: result });
        }
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Console.erro', error);
        return res.status(400).json({ error: 'Erro ao remover usuário.' });
    }
});
module.exports = { createUser, updateUser, showOneUsers, removeUser };
