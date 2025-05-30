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
const getUserIdFromToken_1 = require("../utils/getUserIdFromToken");
const validator = require('validator');
const assetService = require('../services/assetService');
const showAllAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.session_id;
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const id = (0, getUserIdFromToken_1.getUserIdFromToken)(token);
        if (!id)
            return res.status(401).json({ error: 'Token inválido' });
        const result = yield assetService.showAllAssets(id);
        if (result.error) {
            return res.status(400).json({ error: result });
        }
        return res.status(200).json(result);
    }
    catch (e) {
        return res.status(400).json({ error: e.message });
    }
});
const showOneAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.session_id;
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const id = (0, getUserIdFromToken_1.getUserIdFromToken)(token);
        if (!id)
            return res.status(401).json({ error: 'Token inválido' });
        const item = req.params.id;
        if (!validator.isUUID(item)) {
            return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
        }
        const result = yield assetService.showOneAssets(id, item);
        if (result.error) {
            return res.status(400).json({ error: result });
        }
        return res.status(200).json(result);
    }
    catch (e) {
        return res.status(400).json({ error: e.message });
    }
});
const createAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.session_id;
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const id = (0, getUserIdFromToken_1.getUserIdFromToken)(token);
        if (!id)
            return res.status(401).json({ error: 'Token inválido' });
        let { name, description = '', importance = '1' } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Nome inválido' });
        }
        if (isNaN(Number(importance))) {
            importance = '1';
        }
        else {
            let imp = Number(importance);
            if (imp < 1)
                imp = 1;
            if (imp > 5)
                imp = 5;
            importance = imp.toString();
        }
        const result = yield assetService.createAsset(id, { name, description, importance });
        if (result.error) {
            return res.status(400).json({ error: result });
        }
        return res.status(200).json(result);
    }
    catch (e) {
        return res.status(400).json({ error: e.message });
    }
});
const updateAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.session_id;
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const id = (0, getUserIdFromToken_1.getUserIdFromToken)(token);
        if (!id)
            return res.status(401).json({ error: 'Token inválido' });
        const itemId = req.params.id;
        if (!validator.isUUID(itemId)) {
            return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
        }
        const updateContent = req.body;
        for (const key in updateContent) {
            if (updateContent[key] === '' ||
                (key === 'importance' && isNaN(Number(updateContent.importance)))) {
                delete updateContent[key];
            }
            else if (key === 'importance') {
                let importanceValue = Number(updateContent.importance);
                if (importanceValue < 1)
                    importanceValue = 1;
                if (importanceValue > 5)
                    importanceValue = 5;
                updateContent.importance = importanceValue.toString();
            }
        }
        if (Object.keys(updateContent).length === 0) {
            return res.status(400).json({ error: 'Não houve alteração' });
        }
        const result = yield assetService.updateAsset(id, itemId, updateContent);
        return res.status(200).json(result);
    }
    catch (e) {
        return res.status(400).json({ error: e.message });
    }
});
const removeAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.session_id;
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const id = (0, getUserIdFromToken_1.getUserIdFromToken)(token);
        if (!id)
            return res.status(401).json({ error: 'Token inválido' });
        const itemId = req.params.id;
        if (!validator.isUUID(itemId)) {
            return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
        }
        const result = yield assetService.removeAsset(id, itemId);
        return res.status(200).json(result);
    }
    catch (e) {
        return res.status(400).json({ error: e.message });
    }
});
module.exports = { showAllAssets, showOneAsset, createAsset, updateAsset, removeAsset };
