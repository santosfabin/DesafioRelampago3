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
const showOneMaintenanceSql = (userId, assetId, maintenanceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT m.*
      FROM maintenance m
      JOIN asset a ON m.asset_id = a.id
      WHERE m.asset_id = $1 AND a.user_id = $2
      AND m.id = $3
    `;
        const result = yield connection_1.default.query(query, [assetId, userId, maintenanceId]);
        return result.rows;
    }
    catch (e) {
        console.error('Console.erro', e);
        throw new Error(e.message);
    }
});
const showAllMaintenanceSql = (userId, assetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT m.*
      FROM maintenance m
      JOIN asset a ON m.asset_id = a.id
      WHERE m.asset_id = $1 AND a.user_id = $2
    `;
        const result = yield connection_1.default.query(query, [assetId, userId]);
        return result.rows;
    }
    catch (e) {
        console.error('Console.erro', e);
        throw new Error(e.message);
    }
});
const createMaintenanceSql = (maintenanceData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verifyQuery = `SELECT 1 FROM asset WHERE id = $1 AND user_id = $2`;
        const verifyResult = yield connection_1.default.query(verifyQuery, [
            maintenanceData.asset_id,
            maintenanceData.user_id,
        ]);
        if (verifyResult.rowCount === 0) {
            throw new Error('Ativo não encontrado');
        }
        const insertQuery = `
      INSERT INTO maintenance (
        asset_id, service, description, performed_at, status,
        next_due_date, next_due_usage_limit, next_due_usage_current, usage_unit
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9
      ) RETURNING *;
    `;
        const values = [
            maintenanceData.asset_id,
            maintenanceData.service,
            maintenanceData.description,
            maintenanceData.performed_at,
            maintenanceData.status,
            maintenanceData.next_due_date || null,
            maintenanceData.next_due_usage_limit || null,
            maintenanceData.next_due_usage_current || null,
            maintenanceData.usage_unit || null,
        ];
        const insertResult = yield connection_1.default.query(insertQuery, values);
        return insertResult.rows;
    }
    catch (error) {
        throw new Error(error.message);
    }
});
const UPDATABLE_MAINTENANCE_KEYS = [
    'service',
    'description',
    'performed_at',
    'status',
    'next_due_date',
    'next_due_usage_limit',
    'next_due_usage_current',
    'usage_unit',
];
const updateMaintenanceSql = (userId, assetId, maintenanceId, updateDataFromService) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verifyQuery = `SELECT 1 FROM asset WHERE id = $1 AND user_id = $2`;
        const verifyResult = yield connection_1.default.query(verifyQuery, [assetId, userId]);
        if (verifyResult.rowCount === 0) {
            throw new Error('Ativo não encontrado ou não pertence ao usuário');
        }
        const existingQuery = `
      SELECT service, description, performed_at, status, 
      next_due_date, next_due_usage_limit, next_due_usage_current, usage_unit
      FROM maintenance 
      WHERE id = $1 AND asset_id = $2
    `;
        const existingResult = yield connection_1.default.query(existingQuery, [maintenanceId, assetId]);
        if (existingResult.rowCount === 0) {
            throw new Error('Manutenção não encontrada para atualização');
        }
        const existingMaintenanceData = existingResult.rows[0];
        const finalSqlPayload = Object.assign({}, updateDataFromService);
        if ('next_due_date' in updateDataFromService) {
            finalSqlPayload.next_due_date = updateDataFromService.next_due_date;
            finalSqlPayload.next_due_usage_limit = null;
            finalSqlPayload.next_due_usage_current = null;
            finalSqlPayload.usage_unit = null;
        }
        else if ('next_due_usage_limit' in updateDataFromService ||
            'next_due_usage_current' in updateDataFromService ||
            'usage_unit' in updateDataFromService) {
            finalSqlPayload.next_due_date = null;
            finalSqlPayload.next_due_usage_limit =
                updateDataFromService.next_due_usage_limit !== undefined
                    ? updateDataFromService.next_due_usage_limit
                    : existingMaintenanceData.next_due_usage_limit;
            finalSqlPayload.next_due_usage_current =
                updateDataFromService.next_due_usage_current !== undefined
                    ? updateDataFromService.next_due_usage_current
                    : existingMaintenanceData.next_due_usage_current;
            finalSqlPayload.usage_unit =
                updateDataFromService.usage_unit !== undefined
                    ? updateDataFromService.usage_unit
                    : existingMaintenanceData.usage_unit;
            const { next_due_usage_limit, next_due_usage_current, usage_unit } = finalSqlPayload;
            const usageValuesProvided = [next_due_usage_limit, next_due_usage_current, usage_unit];
            const numUsageValuesEffectivelySet = usageValuesProvided.filter(v => v !== null && v !== undefined).length;
            if (numUsageValuesEffectivelySet > 0 && numUsageValuesEffectivelySet < 3) {
                throw new Error('Para previsão por uso, todos os campos (limit, current, unit) devem ser fornecidos juntos, ou todos devem ser nulos para limpar a previsão por uso.');
            }
            else if (numUsageValuesEffectivelySet === 0 &&
                ('next_due_usage_limit' in updateDataFromService ||
                    'next_due_usage_current' in updateDataFromService ||
                    'usage_unit' in updateDataFromService)) {
                finalSqlPayload.next_due_usage_limit = null;
                finalSqlPayload.next_due_usage_current = null;
                finalSqlPayload.usage_unit = null;
            }
        }
        const fieldsForUpdateQuery = {};
        let hasActualChanges = false;
        for (const key of UPDATABLE_MAINTENANCE_KEYS) {
            const isPredictionField = [
                'next_due_date',
                'next_due_usage_limit',
                'next_due_usage_current',
                'usage_unit',
            ].includes(key);
            if (key in finalSqlPayload) {
                if (finalSqlPayload[key] !== undefined) {
                    if (isPredictionField || finalSqlPayload[key] !== existingMaintenanceData[key]) {
                        fieldsForUpdateQuery[key] = finalSqlPayload[key];
                        if (finalSqlPayload[key] !== existingMaintenanceData[key]) {
                            hasActualChanges = true;
                        }
                        else if (isPredictionField &&
                            finalSqlPayload[key] === null &&
                            existingMaintenanceData[key] !== null) {
                            hasActualChanges = true;
                        }
                        else if (isPredictionField &&
                            finalSqlPayload[key] !== null &&
                            existingMaintenanceData[key] === null) {
                            hasActualChanges = true;
                        }
                    }
                }
            }
        }
        if (!hasActualChanges && Object.keys(fieldsForUpdateQuery).length > 0) {
            const changedPredictionType = ('next_due_date' in fieldsForUpdateQuery &&
                existingMaintenanceData.next_due_usage_limit !== null) ||
                (('next_due_usage_limit' in fieldsForUpdateQuery ||
                    'next_due_usage_current' in fieldsForUpdateQuery ||
                    'usage_unit' in fieldsForUpdateQuery) &&
                    existingMaintenanceData.next_due_date !== null);
            if (!changedPredictionType) {
                hasActualChanges = false;
            }
            else {
                hasActualChanges = true;
            }
        }
        const keysToQuery = Object.keys(fieldsForUpdateQuery);
        if (keysToQuery.length === 0 || !hasActualChanges) {
            console.warn('Nenhum campo efetivamente alterado para a manutenção ID:', maintenanceId, ' Retornando dados existentes.');
            return [existingMaintenanceData];
        }
        const setClauses = keysToQuery.map((k, i) => `"${k}" = $${i + 1}`);
        const values = keysToQuery.map(k_string => fieldsForUpdateQuery[k_string]);
        const updateQuery = `
      UPDATE maintenance
      SET ${setClauses.join(', ')}
      WHERE id = $${keysToQuery.length + 1} AND asset_id = $${keysToQuery.length + 2}
      RETURNING *;
    `;
        const result = yield connection_1.default.query(updateQuery, [...values, maintenanceId, assetId]);
        if (result.rowCount === 0) {
            throw new Error('Manutenção não encontrada durante o UPDATE ou nenhuma linha foi efetivamente atualizada (rowCount 0).');
        }
        return result.rows;
    }
    catch (error) {
        console.error('Erro no updateMaintenanceSql:', error.message, error.stack);
        throw error;
    }
});
const removeMaintenanceSql = (userId, assetId, maintenanceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      DELETE FROM maintenance m
      USING asset a
      WHERE m.asset_id = a.id
      AND m.asset_id = $1
      AND a.user_id = $2
      AND m.id = $3
      RETURNING m.*;
    `;
        const result = yield connection_1.default.query(query, [assetId, userId, maintenanceId]);
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
    showOneMaintenanceSql,
    showAllMaintenanceSql,
    createMaintenanceSql,
    updateMaintenanceSql,
    removeMaintenanceSql,
};
