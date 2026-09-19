const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createOrder, verifyPayment, getPayment, listPayments } = require("../controllers/paymentController");

const router = express.Router();

router.use(protect);
router.get("/", listPayments);
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/:id", getPayment);

module.exports = router;
