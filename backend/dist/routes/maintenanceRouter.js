"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router({ mergeParams: true });
const maintenanceRouter = require('../controller/maintenanceRouter');
router.get('/:maintenanceId', maintenanceRouter.showOneMaintenance);
router.get('/', maintenanceRouter.showAllMaintenance);
router.post('/', maintenanceRouter.createMaintenance);
router.put('/:maintenanceId', maintenanceRouter.updateMaintenance);
router.delete('/:maintenanceId', maintenanceRouter.removeMaintenance);
module.exports = router;
