const marketDataService = require("../services/marketDataService");

// GET /api/stocks/search?q=
const search = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    const results = await marketDataService.searchStocks(q);
    res.json({ success: true, data: results, providerConfigured: marketDataService.isConfigured() });
  } catch (error) {
    next(error);
  }
};

// GET /api/stocks/:symbol/quote
const getQuote = async (req, res, next) => {
  try {
    const quote = await marketDataService.getQuote(req.params.symbol);
    res.json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

// GET /api/stocks/:symbol/history?period=1M
const getHistory = async (req, res, next) => {
  try {
    const period = req.query.period || "1M";
    const data = await marketDataService.getHistoricalData(req.params.symbol, period);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/stocks/:symbol/fundamentals
const getFundamentals = async (req, res, next) => {
  try {
    const data = await marketDataService.getFundamentals(req.params.symbol);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/stocks/compare?symbols=TCS,INFY
const compare = async (req, res, next) => {
  try {
    const symbols = (req.query.symbols || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (symbols.length < 2) {
      return res
        .status(400)
        .json({ success: false, message: "Provide at least two symbols to compare" });
    }

    const quotes = await marketDataService.getQuotes(symbols);
    const histories = await Promise.all(
      symbols.map((s) => marketDataService.getHistoricalData(s, "6M"))
    );

    res.json({
      success: true,
      data: {
        quotes,
        histories: histories.reduce((acc, h) => {
          acc[h.symbol] = h;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { search, getQuote, getHistory, getFundamentals, compare };
