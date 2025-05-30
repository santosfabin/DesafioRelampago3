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
const loginRepository = require('../repository/loginRepository');
const { comparePassword } = require('../utils/comparePassword');
const generateToken_1 = require("../utils/generateToken");
const authenticateUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = yield loginRepository.getUserData(email);
        if (!userData) {
            throw new Error('E-mail não cadastrado');
        }
        const isPasswordValid = yield comparePassword(password, userData.password);
        if (!isPasswordValid) {
            throw new Error('Senha inválida');
        }
        const user = userData.id;
        const sessionToken = (0, generateToken_1.generateToken)(userData.id);
        return { user, sessionToken };
    }
    catch (error) {
        throw error;
    }
});
module.exports = {
    authenticateUser,
};
