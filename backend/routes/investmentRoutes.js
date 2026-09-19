const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} = require("../controllers/investmentController");

const router = express.Router();

router.use(protect);
router.route("/").get(getInvestments).post(createInvestment);
router.route("/:id").get(getInvestment).put(updateInvestment).delete(deleteInvestment);

module.exports = router;
