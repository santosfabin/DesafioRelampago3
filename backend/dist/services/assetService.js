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
const assetRepository = require('../repository/assetRepository');
const showOneAssets = (id, item) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield assetRepository.showOneAssetsSql(id, item);
        if ('error' in result) {
            throw new Error(result.message);
        }
        if (result.length > 0) {
            return { asset: result };
        }
        else {
            return { asset: [] };
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
const showAllAssets = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield assetRepository.showAllAssetsSql(id);
        if ('error' in result) {
            throw new Error(result.message);
        }
        if (result.length > 0) {
            return { asset: result };
        }
        else {
            return { asset: [] };
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
const createAsset = (id, asset) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield assetRepository.createAssetSql(id, asset);
    if (!result) {
        throw new Error(`Erro ao criar o ativo no banco de dados.`);
    }
    return { asset: result };
});
const updateAsset = (id, itemId, asset) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield assetRepository.updateAssetSql(id, itemId, asset);
        if (!result) {
            throw new Error(`Erro ao criar o ativo no banco de dados.`);
        }
        return { asset: result };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || 'Erro ao remover ativo.');
        }
        else {
            throw new Error('Erro desconhecido ao remover ativo.');
        }
    }
});
const removeAsset = (id, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield assetRepository.removeAssetrSql(id, itemId);
        if ('error' in result) {
            throw new Error(result.message);
        }
        return { message: `Asset removed` };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message || 'Erro ao remover ativo.');
        }
        else {
            throw new Error('Erro desconhecido ao remover ativo.');
        }
    }
});
module.exports = { showAllAssets, showOneAssets, createAsset, updateAsset, removeAsset };
