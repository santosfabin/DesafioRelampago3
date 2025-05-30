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
const userRepository = require('../repository/userRepository');
const hashPassword_1 = require("../utils/hashPassword");
const generateToken_1 = require("../utils/generateToken");
const createUser = (name, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        throw new Error(`Todos os campos devem ser texto.`);
    }
    const cleanName = name.replace(/\s/g, '');
    if (!/^[\p{L}0-9\s\-_]+$/u.test(name) || cleanName.length < 4) {
        throw new Error(`Nome inválido. Use apenas letras, espaços e números, com pelo menos 4 letras.`);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error(`Email inválido.`);
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
        throw new Error('Senha inválida. Deve conter pelo menos uma letra, um número e no mínimo 8 caracteres.');
    }
    const hashedPassword = yield (0, hashPassword_1.hashPassword)(password);
    if (!hashedPassword) {
        throw new Error(`Falha na geração do hash da senha.`);
    }
    const user = yield userRepository.createUserSql(name, email, hashedPassword);
    if (!user) {
        throw new Error(`Erro ao criar o usuário no banco de dados.`);
    }
    const userWithoutPassword = {
        name: user[0].name,
        email: user[0].email,
    };
    const sessionToken = (0, generateToken_1.generateToken)(user[0].id);
    return { user: userWithoutPassword, sessionToken };
});
const updateUser = (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = updatedFields;
        if (!name && !email && !password) {
            throw new Error('Nenhum campo para atualizar');
        }
        if (name &&
            (typeof name !== 'string' || name.length < 4 || !/^[\p{L}0-9\s\-_]+$/u.test(name))) {
            throw new Error('Nome inválido. Use apenas letras, espaços e números, com pelo menos 4 letras.');
        }
        if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            throw new Error('Email inválido.');
        }
        if (password &&
            (typeof password !== 'string' || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password))) {
            throw new Error('Senha inválida. Deve conter pelo menos uma letra, um número e 8 caracteres.');
        }
        let hashedPassword;
        if (password) {
            hashedPassword = yield (0, hashPassword_1.hashPassword)(password);
            if (!hashedPassword) {
                throw new Error('Falha na geração do hash da senha');
            }
        }
        const fieldsToUpdate = {};
        if (name)
            fieldsToUpdate.name = name;
        if (email)
            fieldsToUpdate.email = email;
        if (password)
            fieldsToUpdate.password = hashedPassword;
        const result = yield userRepository.updateUserSql(id, fieldsToUpdate);
        if ('error' in result) {
            throw new Error(result.message);
        }
        const updatedUser = result;
        const userWithoutPassword = {
            name: updatedUser.name,
            email: updatedUser.email,
        };
        return { user: userWithoutPassword };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        else {
            throw new Error('Erro desconhecido ao atualizar usuário.');
        }
    }
});
const removeUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield userRepository.removeUserSql(id);
        if ('error' in result) {
            throw new Error(result.message);
        }
        return { message: `User removed` };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || 'Erro ao remover usuário.');
        }
        else {
            throw new Error('Erro desconhecido ao remover usuário.');
        }
    }
});
const showOneUsers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield userRepository.showOneUsersSql(id);
        if ('error' in result) {
            return { error: result.error };
        }
        const usersWithoutPassword = result.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
        }));
        return { user: usersWithoutPassword };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || 'Erro ao buscar usuários.');
        }
        else {
            throw new Error('Erro desconhecido ao buscar usuários.');
        }
    }
});
module.exports = { createUser, updateUser, showOneUsers, removeUser };
