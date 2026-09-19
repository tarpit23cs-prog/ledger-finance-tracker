const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

const monthRange = (month, year) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const attachSpent = async (userId, budget) => {
  const { start, end } = monthRange(budget.month, budget.year);
  const spentAgg = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: "expense",
        category: budget.category,
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const spent = spentAgg[0]?.total || 0;
  const remaining = budget.amount - spent;
  const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  let status = "normal";
  if (percentUsed >= 100) status = "exceeded";
  else if (percentUsed >= 80) status = "warning";

  return { ...budget.toObject(), spent, remaining, percentUsed, status };
};

// GET /api/budgets?month=&year=
const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = req.query.month !== undefined ? Number(req.query.month) : now.getMonth();
    const year = req.query.year !== undefined ? Number(req.query.year) : now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year }).sort({ category: 1 });
    const data = await Promise.all(budgets.map((b) => attachSpent(req.user._id, b)));

    res.json({ success: true, data, month, year });
  } catch (error) {
    next(error);
  }
};

// POST /api/budgets
const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;
    if (!category || amount === undefined || month === undefined || year === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Category, amount, month and year are required" });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { $set: { amount } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const data = await attachSpent(req.user._id, budget);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// PUT /api/budgets/:id
const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }
    if (req.body.amount !== undefined) budget.amount = req.body.amount;
    await budget.save();

    const data = await attachSpent(req.user._id, budget);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }
    res.json({ success: true, message: "Budget deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
