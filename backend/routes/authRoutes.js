const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { signup, login, getMe, updateMe, changePassword } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/password", protect, changePassword);

module.exports = router;
