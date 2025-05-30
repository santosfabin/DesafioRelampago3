"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ user: userId }, config_1.default.SECRET_KEY, { expiresIn: '10d' });
};
exports.generateToken = generateToken;
