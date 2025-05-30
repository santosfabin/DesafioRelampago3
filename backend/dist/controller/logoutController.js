"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logout = (req, res) => {
    res.cookie("session_id", "", { expires: new Date(0) });
    res.status(200).json({ message: `logout` });
};
module.exports = { logout };
