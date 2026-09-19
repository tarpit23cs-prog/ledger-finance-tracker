const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getSummary,
  getIncomeReport,
  getExpenseReport,
  getInvestmentReport,
} = require("../controllers/reportController");

const router = express.Router();

router.use(protect);
router.get("/summary", getSummary);
router.get("/income", getIncomeReport);
router.get("/expenses", getExpenseReport);
router.get("/investments", getInvestmentReport);

module.exports = router;
