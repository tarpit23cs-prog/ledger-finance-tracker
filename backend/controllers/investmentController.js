const Holding = require("../models/Holding");
const { getQuote, getQuotes } = require("../services/marketDataService");

const withLiveMetrics = (holding, quote) => {
  const currentPrice = quote ? quote.price : holding.lastPrice || holding.buyPrice;
  const investedValue = holding.quantity * holding.buyPrice;
  const currentValue = holding.quantity * currentPrice;
  const gainLoss = currentValue - investedValue;
  const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;

  return {
    ...holding.toObject(),
    currentPrice,
    investedValue,
    currentValue,
    gainLoss,
    gainLossPercent,
  };
};

// GET /api/investments
const getInvestments = async (req, res, next) => {
  try {
    const holdings = await Holding.find({ user: req.user._id }).sort({ createdAt: -1 });
    const quotes = await getQuotes(holdings.map((h) => h.symbol));

    const data = holdings.map((holding) => withLiveMetrics(holding, quotes[holding.symbol]));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/investments/:id
const getInvestment = async (req, res, next) => {
  try {
    const holding = await Holding.findOne({ _id: req.params.id, user: req.user._id });
    if (!holding) {
      return res.status(404).json({ success: false, message: "Investment not found" });
    }
    const quote = await getQuote(holding.symbol);
    res.json({ success: true, data: withLiveMetrics(holding, quote) });
  } catch (error) {
    next(error);
  }
};

// POST /api/investments
const createInvestment = async (req, res, next) => {
  try {
    const { symbol, name, quantity, buyPrice, buyDate } = req.body;

    if (!symbol || !quantity || !buyPrice) {
      return res
        .status(400)
        .json({ success: false, message: "Symbol, quantity and buy price are required" });
    }

    const quote = await getQuote(symbol);

    const holding = await Holding.create({
      user: req.user._id,
      symbol,
      name,
      quantity,
      buyPrice,
      buyDate: buyDate || Date.now(),
      lastPrice: quote.price,
      lastUpdated: quote.updatedAt,
    });

    res.status(201).json({ success: true, data: withLiveMetrics(holding, quote) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/investments/:id
const updateInvestment = async (req, res, next) => {
  try {
    const holding = await Holding.findOne({ _id: req.params.id, user: req.user._id });
    if (!holding) {
      return res.status(404).json({ success: false, message: "Investment not found" });
    }

    const fields = ["symbol", "name", "quantity", "buyPrice", "buyDate"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) holding[field] = req.body[field];
    });

    await holding.save();
    const quote = await getQuote(holding.symbol);
    res.json({ success: true, data: withLiveMetrics(holding, quote) });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/investments/:id
const deleteInvestment = async (req, res, next) => {
  try {
    const holding = await Holding.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!holding) {
      return res.status(404).json({ success: false, message: "Investment not found" });
    }
    res.json({ success: true, message: "Investment deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
};
