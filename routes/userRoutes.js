const express = require("express");
const { getUser, updateUser } = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware"); // Auth middleware

const router = express.Router();

router.get("/getuser", protect, getUser);
router.put("/updateuser", protect, updateUser);

module.exports = router;