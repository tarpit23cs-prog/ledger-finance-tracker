const Holding = require("../models/Holding");
const Transaction = require("../models/Transaction");
const marketDataService = require("../services/marketDataService");
const aiService = require("../services/aiService");

// POST /api/ai/portfolio
const analyzePortfolio = async (req, res, next) => {
  try {
    const holdings = await Holding.find({ user: req.user._id });
    const quotes = await marketDataService.getQuotes(holdings.map((h) => h.symbol));

    // Only send the fields the AI actually needs - never send user identity,
    // tokens, or payment details.
    const portfolioData = holdings.map((h) => {
      const price = quotes[h.symbol]?.price || h.buyPrice;
      const invested = h.quantity * h.buyPrice;
      const currentValue = h.quantity * price;
      return {
        symbol: h.symbol,
        quantity: h.quantity,
        avgBuyPrice: h.buyPrice,
        currentPrice: price,
        invested,
        currentValue,
        gainLoss: currentValue - invested,
        returnPercent: invested > 0 ? ((currentValue - invested) / invested) * 100 : 0,
      };
    });

    const result = await aiService.analyzePortfolio({ holdings: portfolioData });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/expenses
const analyzeExpenses = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [currentAgg, prevAgg, byCategory] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: req.user._id, type: "expense", date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: "expense",
            date: { $gte: startOfPrevMonth, $lt: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: req.user._id, type: "expense", date: { $gte: startOfMonth } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const expenseData = {
      currentMonthTotal: currentAgg[0]?.total || 0,
      previousMonthTotal: prevAgg[0]?.total || 0,
      byCategory: byCategory.map((c) => ({ category: c._id, total: c.total })),
    };

    const result = await aiService.analyzeExpenses(expenseData);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/stock/:symbol
const researchStock = async (req, res, next) => {
  try {
    const [quote, fundamentals] = await Promise.all([
      marketDataService.getQuote(req.params.symbol),
      marketDataService.getFundamentals(req.params.symbol),
    ]);

    const result = await aiService.researchStock({ quote, fundamentals });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzePortfolio, analyzeExpenses, researchStock };
