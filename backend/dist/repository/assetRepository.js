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
const showAllAssetsSql = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `SELECT * FROM asset where user_id = $1 `;
        const result = yield connection_1.default.query(query, [id]);
        return result.rows;
    }
    catch (e) {
        console.error('Console.erro', e);
        throw new Error(e.message);
    }
});
const showOneAssetsSql = (id, item) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `SELECT * FROM asset where user_id = $1 and id = $2`;
        const result = yield connection_1.default.query(query, [id, item]);
        return result.rows;
    }
    catch (e) {
        console.error('Console.erro', e);
        throw new Error(e.message);
    }
});
const createAssetSql = (userId, asset) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `INSERT INTO asset (user_id, name, description, importance) VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [userId, asset.name, asset.description, asset.importance];
        const result = yield connection_1.default.query(query, values);
        return result.rows;
    }
    catch (e) {
        console.error('Console.erro', e);
        throw new Error(e.message);
    }
});
const updateAssetSql = (userId, itemId, asset) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        for (const [key, value] of Object.entries(asset)) {
            updates.push(`${key} = $${paramIndex++}`);
            values.push(key === 'importance' ? Number(value) : value);
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId, itemId);
        const query = `
      UPDATE asset
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex++} AND id = $${paramIndex}
      RETURNING *
    `;
        const result = yield connection_1.default.query(query, values);
        return result.rows[0];
    }
    catch (e) {
        console.error('Erro ao atualizar asset:', e);
        throw new Error(e.message);
    }
});
const removeAssetrSql = (id, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `DELETE FROM asset WHERE user_id = $1 and id = $2 RETURNING *`;
        const result = yield connection_1.default.query(query, [id, itemId]);
        if (result.rowCount === 0) {
            throw new Error('Ativo não encontrado.');
        }
        return result.rows;
    }
    catch (e) {
        console.error('Console.erro', e);
        throw new Error(e.message);
    }
});
module.exports = {
    showAllAssetsSql,
    showOneAssetsSql,
    createAssetSql,
    updateAssetSql,
    removeAssetrSql,
};
