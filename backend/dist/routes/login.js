"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
const loginController = require('../controller/loginController');
router.post('/', loginController.login);
router.get('/checkLogin', middleware_1.verifyActiveSession, (req, res) => {
    res.json({ loggedIn: true, user: req.user });
});
module.exports = router;
