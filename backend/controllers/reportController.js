const Transaction = require("../models/Transaction");
const Holding = require("../models/Holding");
const { getQuotes } = require("../services/marketDataService");

const parseRange = (query) => {
  const end = query.endDate ? new Date(query.endDate) : new Date();
  const start = query.startDate
    ? new Date(query.startDate)
    : new Date(end.getFullYear(), end.getMonth() - 5, 1);
  return { start, end };
};

// GET /api/reports/summary
const getSummary = async (req, res, next) => {
  try {
    const { start, end } = parseRange(req.query);
    const userId = req.user._id;

    const [incomeAgg, expenseAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: "income", date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: "expense", date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const income = incomeAgg[0]?.total || 0;
    const expenses = expenseAgg[0]?.total || 0;

    res.json({
      success: true,
      data: { income, expenses, savings: income - expenses, range: { start, end } },
    });
  } catch (error) {
    next(error);
  }
};

const trendByMonth = async (userId, type, start, end) => {
  return Transaction.aggregate([
    { $match: { user: userId, type, date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { year: { $year: "$date" }, month: { $month: "$date" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};

// GET /api/reports/income
const getIncomeReport = async (req, res, next) => {
  try {
    const { start, end } = parseRange(req.query);
    const trend = await trendByMonth(req.user._id, "income", start, end);
    res.json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/expenses
const getExpenseReport = async (req, res, next) => {
  try {
    const { start, end } = parseRange(req.query);
    const userId = req.user._id;

    const [trend, byCategory] = await Promise.all([
      trendByMonth(userId, "expense", start, end),
      Transaction.aggregate([
        { $match: { user: userId, type: "expense", date: { $gte: start, $lte: end } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: { trend, byCategory: byCategory.map((c) => ({ category: c._id, total: c.total })) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/investments
const getInvestmentReport = async (req, res, next) => {
  try {
    const holdings = await Holding.find({ user: req.user._id });
    const quotes = await getQuotes(holdings.map((h) => h.symbol));

    const rows = holdings.map((h) => {
      const price = quotes[h.symbol]?.price || h.lastPrice || h.buyPrice;
      const invested = h.quantity * h.buyPrice;
      const currentValue = h.quantity * price;
      return {
        symbol: h.symbol,
        invested,
        currentValue,
        gainLoss: currentValue - invested,
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        invested: acc.invested + r.invested,
        currentValue: acc.currentValue + r.currentValue,
        gainLoss: acc.gainLoss + r.gainLoss,
      }),
      { invested: 0, currentValue: 0, gainLoss: 0 }
    );

    res.json({ success: true, data: { rows, totals } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getIncomeReport, getExpenseReport, getInvestmentReport };
