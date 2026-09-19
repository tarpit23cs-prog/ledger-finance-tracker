const Watchlist = require("../models/Watchlist");
const marketDataService = require("../services/marketDataService");

// GET /api/watchlist
const getWatchlist = async (req, res, next) => {
  try {
    const items = await Watchlist.find({ user: req.user._id }).sort({ createdAt: -1 });
    const quotes = await marketDataService.getQuotes(items.map((i) => i.symbol));

    const data = items.map((item) => ({
      ...item.toObject(),
      quote: quotes[item.symbol] || null,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/watchlist
const addToWatchlist = async (req, res, next) => {
  try {
    const { symbol, name } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, message: "Symbol is required" });
    }

    const item = await Watchlist.findOneAndUpdate(
      { user: req.user._id, symbol: symbol.toUpperCase() },
      { $set: { name: name || symbol.toUpperCase() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/watchlist/:id
const removeFromWatchlist = async (req, res, next) => {
  try {
    const item = await Watchlist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, message: "Watchlist item not found" });
    }
    res.json({ success: true, message: "Removed from watchlist" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
