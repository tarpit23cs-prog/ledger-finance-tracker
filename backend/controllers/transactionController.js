const Transaction = require("../models/Transaction");

const buildFilter = (userId, query) => {
  const filter = { user: userId };

  if (query.type && ["income", "expense"].includes(query.type)) {
    filter.type = query.type;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.search) {
    filter.description = { $regex: query.search, $options: "i" };
  }
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) filter.date.$lte = new Date(query.endDate);
  }
  if (query.minAmount || query.maxAmount) {
    filter.amount = {};
    if (query.minAmount) filter.amount.$gte = Number(query.minAmount);
    if (query.maxAmount) filter.amount.$lte = Number(query.maxAmount);
  }

  return filter;
};

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const filter = buildFilter(req.user._id, req.query);

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/:id
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date, isRecurring, frequency } = req.body;

    if (!type || !amount || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Type, amount and category are required" });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      description,
      date: date || Date.now(),
      isRecurring: !!isRecurring,
      frequency: isRecurring ? frequency || "monthly" : "none",
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const fields = ["type", "amount", "category", "description", "date", "isRecurring", "frequency"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) transaction[field] = req.body[field];
    });

    await transaction.save();
    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
