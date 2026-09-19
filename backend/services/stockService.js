/**
 * Stock price service.
 *
 * By default this runs in "mock" mode so the app works without any external
 * API key. It generates a stable, deterministic price per symbol (based on a
 * hash of the symbol) and adds a small time-based drift so prices move
 * slightly between calls, similar to a live market feed.
 *
 * To use a real provider, set STOCK_API_PROVIDER and STOCK_API_KEY in .env
 * and implement fetchFromProvider() below for that provider's API shape.
 */

function hashSymbol(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash * 31 + symbol.charCodeAt(i)) % 100000;
  }
  return hash;
}

function mockPrice(symbol) {
  const base = 50 + (hashSymbol(symbol) % 4500) / 10; // base price between 50 and 500
  const driftSeed = Math.floor(Date.now() / (1000 * 60 * 5)); // changes every 5 minutes
  const drift = Math.sin(driftSeed + hashSymbol(symbol)) * (base * 0.02); // +-2%
  const price = Math.max(1, base + drift);
  return Math.round(price * 100) / 100;
}

async function fetchFromProvider(symbol) {
  // Placeholder for a real integration, e.g. Finnhub or Alpha Vantage.
  // Left unimplemented intentionally; falls back to the mock price.
  return mockPrice(symbol);
}

async function getQuote(symbol) {
  const provider = (process.env.STOCK_API_PROVIDER || "mock").toLowerCase();
  const price =
    provider === "mock" || !process.env.STOCK_API_KEY
      ? mockPrice(symbol)
      : await fetchFromProvider(symbol);

  return {
    symbol: symbol.toUpperCase(),
    price,
    updatedAt: new Date(),
  };
}

async function getQuotes(symbols) {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const quotes = await Promise.all(unique.map((symbol) => getQuote(symbol)));
  return quotes.reduce((acc, quote) => {
    acc[quote.symbol] = quote;
    return acc;
  }, {});
}

module.exports = { getQuote, getQuotes };
