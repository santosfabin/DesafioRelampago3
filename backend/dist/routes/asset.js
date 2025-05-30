"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const assetController = require('../controller/assetController');
const maintenanceRouter = require('./maintenanceRouter');
router.use('/:id/maintenances', maintenanceRouter);
router.get('/:id', assetController.showOneAsset);
router.get('/', assetController.showAllAssets);
router.post('/', assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.removeAsset);
module.exports = router;
