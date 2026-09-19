const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    provider: { type: String, default: "razorpay" },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    signature: { type: String },

    status: {
      type: String,
      enum: ["CREATED", "PENDING", "SUCCESS", "FAILED", "CANCELLED", "VERIFICATION_FAILED"],
      default: "CREATED",
    },

    holding: { type: mongoose.Schema.Types.ObjectId, ref: "Holding" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
