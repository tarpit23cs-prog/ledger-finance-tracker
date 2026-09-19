const Transaction = require("../models/Transaction");
const Holding = require("../models/Holding");
const { getQuotes } = require("../services/marketDataService");

// GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [incomeAgg, expenseAgg, categoryAgg, recentTransactions, holdings] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: "income", date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: "expense", date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: "expense", date: { $gte: startOfMonth } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
      Transaction.find({ user: userId }).sort({ date: -1 }).limit(6),
      Holding.find({ user: userId }),
    ]);

    const income = incomeAgg[0]?.total || 0;
    const expenses = expenseAgg[0]?.total || 0;

    // Last 6 months income vs expense trend
    const monthlyIncomeExpense = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      // eslint-disable-next-line no-await-in-loop
      const [inc, exp] = await Promise.all([
        Transaction.aggregate([
          { $match: { user: userId, type: "income", date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { user: userId, type: "expense", date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      monthlyIncomeExpense.push({
        month: start.toLocaleString("default", { month: "short" }),
        income: inc[0]?.total || 0,
        expenses: exp[0]?.total || 0,
      });
    }

    const quotes = await getQuotes(holdings.map((h) => h.symbol));
    let invested = 0;
    let currentValue = 0;
    holdings.forEach((h) => {
      const price = quotes[h.symbol]?.price || h.lastPrice || h.buyPrice;
      invested += h.quantity * h.buyPrice;
      currentValue += h.quantity * price;
    });
    const investmentReturn = currentValue - invested;
    const investmentReturnPercent = invested > 0 ? (investmentReturn / invested) * 100 : 0;

    res.json({
      success: true,
      data: {
        balance: income - expenses,
        income,
        expenses,
        investments: currentValue,
        monthlyIncomeExpense,
        categorySpending: categoryAgg.map((c) => ({ category: c._id, total: c.total })),
        recentTransactions,
        portfolioSummary: {
          invested,
          currentValue,
          return: investmentReturn,
          returnPercent: investmentReturnPercent,
          holdingsCount: holdings.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
