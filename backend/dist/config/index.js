"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getEnvVar(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing environment variable: ${name}`);
    return value;
}
const config = {
    NODE_ENV: getEnvVar('NODE_ENV'),
    HOSTNAME: getEnvVar('HOSTNAME'),
    PORT: Number(getEnvVar('PORT')),
    SECRET_KEY: getEnvVar('SECRET_KEY'),
    DB_HOST: getEnvVar('DB_HOST'),
    DB_USER: getEnvVar('DB_USER'),
    DB_PASSWORD: getEnvVar('DB_PASSWORD'),
    DB_NAME: getEnvVar('DB_NAME'),
    DB_PORT: Number(getEnvVar('DB_PORT')),
};
exports.default = config;
