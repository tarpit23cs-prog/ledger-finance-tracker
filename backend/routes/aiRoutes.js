const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { analyzePortfolio, analyzeExpenses, researchStock } = require("../controllers/aiController");

const router = express.Router();

router.use(protect);
router.post("/portfolio", analyzePortfolio);
router.post("/expenses", analyzeExpenses);
router.post("/stock/:symbol", researchStock);

module.exports = router;
