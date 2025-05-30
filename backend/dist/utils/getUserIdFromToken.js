"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIdFromToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const getUserIdFromToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.SECRET_KEY);
        if (!decoded.user) {
            return null;
        }
        return decoded.user;
    }
    catch (error) {
        return null;
    }
};
exports.getUserIdFromToken = getUserIdFromToken;
