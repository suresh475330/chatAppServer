const express = require("express");
const { registerUser, loginUser, logout,forgotPassword,resetPassword } = require("../controllers/authControllers");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.post("/forgotpassword",forgotPassword);
router.post("/resetpassword/:resetToken",resetPassword);

module.exports = router;