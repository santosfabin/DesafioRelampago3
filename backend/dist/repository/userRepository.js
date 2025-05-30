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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("../database/connection"));
const createUserSql = (name, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield connection_1.default.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, password]);
        return result.rows;
    }
    catch (e) {
        console.error('Console.erro', e);
        if (e.code === '23505' && e.constraint === 'users_email_key') {
            throw new Error('Erro ao criar usuário');
        }
        throw new Error(e.message);
    }
});
const updateUserSql = (id, updatedFields) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userCheckQuery = 'SELECT * FROM users WHERE id = $1';
        const userCheckResult = yield connection_1.default.query(userCheckQuery, [id]);
        if (userCheckResult.rowCount === 0) {
            console.error('Usuário não encontrado.');
            throw new Error(`Usuário não encontrado.`);
        }
        if (updatedFields.email) {
            const emailCheckQuery = 'SELECT * FROM users WHERE email = $1 AND id != $2';
            const emailCheckResult = yield connection_1.default.query(emailCheckQuery, [updatedFields.email, id]);
            if (emailCheckResult.rowCount > 0) {
                throw new Error('Não foi possível atualizar o usuário.');
            }
        }
        let setClause = '';
        const values = [];
        let valueIndex = 1;
        if (updatedFields.name) {
            setClause += `name = $${valueIndex}, `;
            values.push(updatedFields.name);
            valueIndex++;
        }
        if (updatedFields.email) {
            setClause += `email = $${valueIndex}, `;
            values.push(updatedFields.email);
            valueIndex++;
        }
        if (updatedFields.password) {
            setClause += `password = $${valueIndex}, `;
            values.push(updatedFields.password);
            valueIndex++;
        }
        if (!setClause) {
            console.error('Nenhum campo para atualizar.');
            throw new Error(`Nenhum campo para atualizar.`);
        }
        setClause = setClause.slice(0, -2);
        values.push(id);
        const query = `UPDATE users SET ${setClause} WHERE id = $${valueIndex} RETURNING *`;
        const result = yield connection_1.default.query(query, values);
        if (result.rowCount === 0) {
            console.error('Erro ao atualizar usuário.');
            throw new Error(`Erro ao atualizar usuário.`);
        }
        return result.rows;
    }
    catch (e) {
        throw new Error(e.message);
    }
});
const removeUserSql = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield connection_1.default.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        return result.rows;
    }
    catch (e) {
        console.error('Console.erro', e);
        throw new Error(e.message);
    }
});
const showOneUsersSql = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield connection_1.default.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows;
    }
    catch (e) {
        console.error(e);
        return null;
    }
});
module.exports = { createUserSql, updateUserSql, showOneUsersSql, removeUserSql };
