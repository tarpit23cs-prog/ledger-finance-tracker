const Payment = require("../models/Payment");
const Holding = require("../models/Holding");
const marketDataService = require("../services/marketDataService");
const paymentService = require("../services/paymentService");

// POST /api/payments/create-order
// Body: { symbol, quantity }
// The backend decides the price. The frontend never gets to set it.
const createOrder = async (req, res, next) => {
  try {
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Symbol and quantity are required" });
    }

    if (!paymentService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "Razorpay test mode is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend .env file.",
      });
    }

    const quote = await marketDataService.getQuote(symbol);
    const totalAmount = Math.round(quote.price * quantity * 100) / 100;
    const amountInPaise = Math.round(totalAmount * 100);

    const receipt = `rcpt_${req.user._id}_${Date.now()}`;
    const order = await paymentService.createOrder({
      amountInPaise,
      receipt,
      notes: { userId: String(req.user._id), symbol: quote.symbol, quantity: String(quantity) },
    });

    const payment = await Payment.create({
      user: req.user._id,
      symbol: quote.symbol,
      quantity,
      price: quote.price,
      totalAmount,
      orderId: order.id,
      status: "CREATED",
    });

    res.status(201).json({
      success: true,
      data: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        symbol: quote.symbol,
        quantity,
        price: quote.price,
        totalAmount,
        paymentRecordId: payment._id,
        testMode: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
      req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    const payment = await Payment.findOne({ orderId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    // Idempotency: if this order was already verified and turned into a
    // holding, do not create a second BUY transaction.
    if (payment.status === "SUCCESS" && payment.holding) {
      return res.json({
        success: true,
        message: "Payment already verified",
        data: { payment, alreadyProcessed: true },
      });
    }

    const isValid = paymentService.verifySignature({ orderId, paymentId, signature });

    if (!isValid) {
      payment.status = "VERIFICATION_FAILED";
      await payment.save();
      return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    }

    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = "SUCCESS";

    // Create or top up the holding using the server-recorded price, never a
    // client-supplied one.
    let holding = await Holding.findOne({ user: req.user._id, symbol: payment.symbol });

    if (holding) {
      const newQuantity = holding.quantity + payment.quantity;
      const newAvgPrice =
        (holding.quantity * holding.buyPrice + payment.quantity * payment.price) / newQuantity;
      holding.quantity = newQuantity;
      holding.buyPrice = Math.round(newAvgPrice * 100) / 100;
      await holding.save();
    } else {
      holding = await Holding.create({
        user: req.user._id,
        symbol: payment.symbol,
        name: payment.symbol,
        quantity: payment.quantity,
        buyPrice: payment.price,
        buyDate: new Date(),
        lastPrice: payment.price,
        lastUpdated: new Date(),
      });
    }

    payment.holding = holding._id;
    await payment.save();

    res.json({
      success: true,
      message: "Simulated purchase completed",
      data: { payment, holding },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/:id
const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments
const listPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getPayment, listPayments };
