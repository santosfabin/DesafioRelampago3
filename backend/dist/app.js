"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes"));
const connection_1 = __importDefault(require("./database/connection"));
const config_1 = __importDefault(require("./config"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = Number(config_1.default.PORT) || 3000;
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use('/api', routes_1.default);
// Serve arquivos estáticos do React (build)
const staticPath = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(staticPath));
// Redireciona qualquer rota não API para index.html
app.get(`/{*splat}`, (_req, res) => {
    res.sendFile(path_1.default.join(staticPath, 'index.html'));
});
connection_1.default
    .connect()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
})
    .catch((e) => {
    if (e instanceof Error) {
        console.error('Erro na conexão com o banco de dados:', e);
    }
    else {
        console.error('Erro na conexão com o banco de dados:', e);
    }
});
