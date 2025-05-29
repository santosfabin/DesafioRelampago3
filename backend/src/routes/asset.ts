import express from 'express';

const router = express.Router();

const assetController = require('../controller/assetController');
const maintenanceRouter = require('./maintenanceRouter');

router.use('/:id/maintenances', maintenanceRouter);

router.get('/:id', assetController.showOneAsset);
router.get('/', assetController.showAllAssets);
router.post('/', assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.removeAsset);

module.exports = router;
