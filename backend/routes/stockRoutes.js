const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { search, getQuote, getHistory, getFundamentals, compare } = require("../controllers/stockController");

const router = express.Router();

router.use(protect);
router.get("/search", search);
router.get("/compare", compare);
router.get("/:symbol/quote", getQuote);
router.get("/:symbol/history", getHistory);
router.get("/:symbol/fundamentals", getFundamentals);

module.exports = router;
