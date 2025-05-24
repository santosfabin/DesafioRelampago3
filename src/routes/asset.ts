const express = require('express');
const router = express.Router();

const assetController = require('../controller/assetController');

router.get('/:id', assetController.showOneAssets);
router.get('/', assetController.showAllAssets);
router.post('/', assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.removeAsset);

module.exports = router;
