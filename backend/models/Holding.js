const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    buyPrice: { type: Number, required: true, min: 0 },
    buyDate: { type: Date, required: true, default: Date.now },
    lastPrice: { type: Number, default: 0 },
    lastUpdated: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holding", holdingSchema);
