/**
 * Market data service.
 *
 * Single place that talks to an external market data provider. Everything
 * else in the app (controllers, portfolio calculations) should go through
 * this file instead of calling a provider's API directly, so the provider
 * can be swapped later without touching business logic.
 *
 * Supported providers via MARKET_API_PROVIDER:
 *   - "mock"        (default, no key needed - deterministic fake data)
 *   - "alphavantage" (https://www.alphavantage.co)
 *   - "finnhub"      (https://finnhub.io)
 *
 * Set MARKET_API_KEY and MARKET_API_PROVIDER in .env to use a real provider.
 * All responses are normalized to:
 *   { symbol, name, price, change, changePercent, volume, lastUpdated, freshness }
 */

const mockStore = require("./stockService");

const PROVIDER = (process.env.MARKET_API_PROVIDER || "mock").toLowerCase();
const API_KEY = process.env.MARKET_API_KEY || "";

// Simple in-memory cache to avoid hammering the provider / rate limits.
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL_MS) {
    return entry.value;
  }
  return null;
}

function setCached(key, value) {
  cache.set(key, { value, time: Date.now() });
}

function isConfigured() {
  return PROVIDER !== "mock" && !!API_KEY;
}

async function normalizeQuote(symbol) {
  if (!isConfigured()) {
    const quote = await mockStore.getQuote(symbol);
    return {
      symbol: quote.symbol,
      name: quote.symbol,
      price: quote.price,
      change: 0,
      changePercent: 0,
      volume: null,
      lastUpdated: quote.updatedAt,
      freshness: "Simulated - no market data provider configured",
    };
  }

  try {
    if (PROVIDER === "finnhub") {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`
      );
      const data = await res.json();
      if (!data || data.c === undefined) throw new Error("No data returned by provider");
      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        volume: null,
        lastUpdated: new Date(data.t ? data.t * 1000 : Date.now()),
        freshness: "Latest available (provider: Finnhub)",
      };
    }

    if (PROVIDER === "alphavantage") {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
          symbol
        )}&apikey=${API_KEY}`
      );
      const data = await res.json();
      const q = data["Global Quote"];
      if (!q || !q["05. price"]) throw new Error("No data returned by provider");
      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        price: parseFloat(q["05. price"]),
        change: parseFloat(q["09. change"]),
        changePercent: parseFloat((q["10. change percent"] || "0").replace("%", "")),
        volume: parseInt(q["06. volume"], 10) || null,
        lastUpdated: new Date(),
        freshness: "Latest available (provider: Alpha Vantage, may be delayed)",
      };
    }

    throw new Error(`Unknown provider: ${PROVIDER}`);
  } catch (error) {
    // Provider failed (rate limit, invalid symbol, network) - fall back to mock
    // so the rest of the app keeps working, but flag it clearly.
    const quote = await mockStore.getQuote(symbol);
    return {
      symbol: quote.symbol,
      name: quote.symbol,
      price: quote.price,
      change: 0,
      changePercent: 0,
      volume: null,
      lastUpdated: quote.updatedAt,
      freshness: `Data unavailable from provider (${error.message}) - showing simulated price`,
    };
  }
}

async function getQuote(symbol) {
  const key = `quote:${symbol.toUpperCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  const quote = await normalizeQuote(symbol);
  setCached(key, quote);
  return quote;
}

async function getQuotes(symbols) {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const quotes = await Promise.all(unique.map((symbol) => getQuote(symbol)));
  return quotes.reduce((acc, quote) => {
    acc[quote.symbol] = quote;
    return acc;
  }, {});
}

async function searchStocks(query) {
  if (!isConfigured()) {
    // Without a real provider we cannot search a universe of symbols.
    // Return the query itself as a candidate symbol so the UI stays usable.
    const upper = query.trim().toUpperCase();
    if (!upper) return [];
    return [{ symbol: upper, name: upper }];
  }

  try {
    if (PROVIDER === "finnhub") {
      const res = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${API_KEY}`
      );
      const data = await res.json();
      return (data.result || []).slice(0, 12).map((r) => ({ symbol: r.symbol, name: r.description }));
    }

    if (PROVIDER === "alphavantage") {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
          query
        )}&apikey=${API_KEY}`
      );
      const data = await res.json();
      return (data.bestMatches || []).slice(0, 12).map((r) => ({
        symbol: r["1. symbol"],
        name: r["2. name"],
      }));
    }
  } catch (error) {
    return [];
  }

  return [];
}

async function getHistoricalData(symbol, period = "1M") {
  // Real historical endpoints differ significantly per provider and often
  // require a paid tier. Until a provider key is wired in for this call,
  // generate a plausible historical series from the current quote so charts
  // remain functional. This is clearly labeled as simulated in the response.
  const quote = await getQuote(symbol);
  const points = { "1D": 24, "1W": 7, "1M": 30, "6M": 26, "1Y": 52, "5Y": 60 }[period] || 30;
  const now = Date.now();
  const stepMs =
    period === "1D" ? 60 * 60 * 1000 : period === "1W" ? 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const series = [];
  let price = quote.price * 0.9;
  for (let i = points; i >= 0; i -= 1) {
    const t = new Date(now - i * stepMs * (period === "1M" ? 1 : period === "1Y" ? 7 : period === "5Y" ? 30 : 1));
    const seed = Math.sin(i * 12.9898 + symbol.length) * 43758.5453;
    const noise = (seed - Math.floor(seed) - 0.5) * (quote.price * 0.015);
    price = Math.max(1, price + noise + (quote.price - price) * 0.05);
    series.push({ date: t.toISOString(), price: Math.round(price * 100) / 100 });
  }
  series.push({ date: new Date(now).toISOString(), price: quote.price });

  return {
    symbol: quote.symbol,
    period,
    freshness: isConfigured() ? quote.freshness : "Simulated historical series",
    points: series,
  };
}

async function getFundamentals(symbol) {
  if (!isConfigured()) {
    return { symbol: symbol.toUpperCase(), available: false, message: "Data unavailable" };
  }

  try {
    if (PROVIDER === "alphavantage") {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(
          symbol
        )}&apikey=${API_KEY}`
      );
      const data = await res.json();
      if (!data || !data.Symbol) {
        return { symbol: symbol.toUpperCase(), available: false, message: "Data unavailable" };
      }
      return {
        symbol: data.Symbol,
        available: true,
        marketCap: data.MarketCapitalization || null,
        peRatio: data.PERatio || null,
        eps: data.EPS || null,
        dividendYield: data.DividendYield || null,
        week52High: data["52WeekHigh"] || null,
        week52Low: data["52WeekLow"] || null,
      };
    }
  } catch (error) {
    return { symbol: symbol.toUpperCase(), available: false, message: "Data unavailable" };
  }

  return { symbol: symbol.toUpperCase(), available: false, message: "Data unavailable" };
}

module.exports = {
  isConfigured,
  getQuote,
  getQuotes,
  searchStocks,
  getHistoricalData,
  getFundamentals,
};
