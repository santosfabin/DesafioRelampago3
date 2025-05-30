"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyActiveSession = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const verifyActiveSession = (req, res, next) => {
    const sessionToken = req.cookies.session_id;
    if (!sessionToken) {
        res.status(400).json({ error: 'Token de sessão inválido' });
        return;
    }
    jsonwebtoken_1.default.verify(sessionToken, config_1.default.SECRET_KEY, (error, decoded) => {
        if (error) {
            res.cookie('session_id', '', { expires: new Date(0) });
            res.status(404).json({ error: 'Sessão inválida' });
            return;
        }
        req.user = decoded.user;
        next();
    });
};
exports.verifyActiveSession = verifyActiveSession;
