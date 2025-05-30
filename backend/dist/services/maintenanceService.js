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
const maintenanceRepository = require('../repository/maintenanceRepository');
const showOneMaintenance = (userId, assetId, maintenanceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield maintenanceRepository.showOneMaintenanceSql(userId, assetId, maintenanceId);
        if ('error' in result) {
            throw new Error(result.message);
        }
        if (result.length > 0) {
            return { maintenance: result };
        }
        else {
            return { maintenance: [] };
        }
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
const showAllMaintenance = (userId, assetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield maintenanceRepository.showAllMaintenanceSql(userId, assetId);
        if ('error' in result) {
            throw new Error(result.message);
        }
        if (result.length > 0) {
            return { maintenance: result };
        }
        else {
            return { maintenance: [] };
        }
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
const createMaintenance = (maintenanceData) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield maintenanceRepository.createMaintenanceSql(maintenanceData);
    return { mainenance: result };
});
function cleanUpdateData(updateData) {
    const usageUnits = ['km', 'horas', 'ciclos'];
    const validStatuses = ['ativa', 'realizada', 'adiada', 'cancelada'];
    const cleaned = {};
    if ('description' in updateData) {
        if (updateData.description === null) {
            delete cleaned.description;
        }
        else if (typeof updateData.description === 'string') {
            const desc = updateData.description.trim();
            if (desc !== '') {
                cleaned.description = desc;
            }
        }
    }
    if ('status' in updateData && validStatuses.includes(updateData.status)) {
        cleaned.status = updateData.status;
    }
    if ('service' in updateData && typeof updateData.service === 'string') {
        const svc = updateData.service.trim();
        if (svc !== '') {
            cleaned.service = svc;
        }
    }
    if ('performed_at' in updateData) {
        if (updateData.performed_at === null ||
            (typeof updateData.performed_at === 'string' && updateData.performed_at.trim() !== '')) {
            cleaned.performed_at = updateData.performed_at;
        }
    }
    const hasValidDate = typeof updateData.next_due_date === 'string' && updateData.next_due_date.trim() !== '';
    if (hasValidDate) {
        cleaned.next_due_date = updateData.next_due_date.trim();
        delete cleaned.next_due_usage_limit;
        delete cleaned.next_due_usage_current;
        delete cleaned.usage_unit;
        return cleaned;
    }
    const hasUsageLimit = typeof updateData.next_due_usage_limit === 'number' && updateData.next_due_usage_limit >= 0;
    const hasUsageCurrent = typeof updateData.next_due_usage_current === 'number' && updateData.next_due_usage_current >= 0;
    const hasUsageUnit = typeof updateData.usage_unit === 'string' && usageUnits.includes(updateData.usage_unit);
    if (hasUsageLimit || hasUsageCurrent || hasUsageUnit) {
        delete cleaned.next_due_date;
        if (hasUsageLimit) {
            cleaned.next_due_usage_limit = updateData.next_due_usage_limit;
        }
        else {
            delete cleaned.next_due_usage_limit;
        }
        if (hasUsageCurrent) {
            cleaned.next_due_usage_current = updateData.next_due_usage_current;
        }
        else {
            delete cleaned.next_due_usage_current;
        }
        if (hasUsageUnit) {
            cleaned.usage_unit = updateData.usage_unit;
        }
        else {
            delete cleaned.usage_unit;
        }
        return cleaned;
    }
    delete cleaned.next_due_date;
    delete cleaned.next_due_usage_limit;
    delete cleaned.next_due_usage_current;
    delete cleaned.usage_unit;
    return cleaned;
}
const updateMaintenance = (userId, assetId, maintenanceId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cleanedUpdateData = cleanUpdateData(updateData);
        if (Object.keys(cleanedUpdateData).length === 0) {
            throw new Error('Nenhum campo válido para atualizar');
        }
        const result = yield maintenanceRepository.updateMaintenanceSql(userId, assetId, maintenanceId, cleanedUpdateData);
        if ('error' in result) {
            throw new Error(result.message);
        }
        if (result.length > 0) {
            return { maintenance: result };
        }
        else {
            throw new Error('Maintenance not updated');
        }
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || 'Erro ao atualizar manutenção.');
        }
        else {
            throw new Error('Erro desconhecido ao atualizar manutenção.');
        }
    }
});
const removeMaintenance = (userId, assetId, maintenanceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield maintenanceRepository.removeMaintenanceSql(userId, assetId, maintenanceId);
        if ('error' in result) {
            throw new Error(result.message);
        }
        return { message: `Maintenance removed` };
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
module.exports = {
    showOneMaintenance,
    showAllMaintenance,
    createMaintenance,
    updateMaintenance,
    removeMaintenance,
};
