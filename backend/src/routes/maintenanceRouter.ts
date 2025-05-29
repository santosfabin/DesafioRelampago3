import express from 'express';

const router = express.Router({ mergeParams: true });

const maintenanceRouter = require('../controller/maintenanceRouter');

router.get('/:maintenanceId', maintenanceRouter.showOneMaintenance);
router.get('/', maintenanceRouter.showAllMaintenance);
router.post('/', maintenanceRouter.createMaintenance);
router.put('/:maintenanceId', maintenanceRouter.updateMaintenance);
router.delete('/:maintenanceId', maintenanceRouter.removeMaintenance);

module.exports = router;
