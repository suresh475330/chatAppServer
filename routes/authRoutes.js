const express = require("express");
const { registerUser, loginUser, logout,forgotPassword,resetPassword, changePassword } = require("../controllers/authControllers");
const {protect} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.post("/forgotpassword",forgotPassword);
router.post("/resetpassword/:resetToken",resetPassword);
router.put("/changepassword",protect,changePassword);

module.exports = router;