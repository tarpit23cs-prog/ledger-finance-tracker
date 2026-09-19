# Ledger - Personal Finance & Simulated Investment Tracker

A full-stack app for tracking personal finances (income, expenses, budgets)
layered with a simulated investment/portfolio module: stock search, watchlist,
holdings, portfolio analytics, a Razorpay **test-mode** simulated purchase
flow, and an optional AI insight feature.

This is application code only. Git, Docker, CI/CD, cloud infrastructure and
deployment are intentionally out of scope and left to you.

## Tech stack

**Frontend:** React 18, Vite, React Router, Recharts, Axios, plain CSS
(no UI framework, no gradients - a minimal design system in
`frontend/src/styles/index.css`).

**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcrypt, node-cron,
Razorpay Node SDK.

## Folder structure

```text
project-root/
├── backend/
│   ├── config/        # MongoDB connection
│   ├── controllers/    # Route handlers (thin - business logic lives in services)
│   ├── middleware/      # auth + error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── services/          # marketDataService, paymentService, aiService, stockService (mock), recurringJob
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/        # axios client + grouped endpoint helpers
│   │   ├── components/  # reusable UI pieces
│   │   ├── context/      # Auth + Toast context
│   │   ├── pages/         # one file per route
│   │   └── routes/         # ProtectedRoute
│   └── .env.example
├── API.md
└── README.md
```

## Modules

- **Finance & expenses** - transactions (income/expense) with filters,
  search, pagination, recurring transactions (processed by a daily cron job),
  budgets by category/month with spend tracking.
- **Dashboard** - a single aggregated `GET /api/dashboard` endpoint (balance,
  6-month income/expense trend, category spending, recent transactions,
  portfolio summary).
- **Stocks** - search, quote, historical chart (1D/1W/1M/6M/1Y/5Y), and
  fundamentals, all going through one `marketDataService` abstraction so the
  provider can be swapped without touching controllers.
- **Investments / Portfolio** - holdings with buy price, quantity, and
  server-calculated current value / P&L / return %; a dedicated Portfolio
  page adds allocation and best/worst performer insights.
- **Watchlist** - add/remove symbols, see latest quote inline.
- **Reports** - income/expense/savings trend, category breakdown, investment
  performance, CSV export.
- **Razorpay test-mode simulated purchase** - see below.
- **AI financial assistant** - see below. Ships disabled ("coming soon")
  until you add a key.

## Market data

Set in `backend/.env`:

```env
MARKET_API_PROVIDER=mock          # or "alphavantage" / "finnhub"
MARKET_API_KEY=
```

With no key, the app runs on a deterministic mock price generator
(`services/stockService.js`) so it works immediately, and clearly labels
prices as simulated. Historical data is currently always generated from the
latest quote (labeled "Simulated historical series") - wiring a provider's
real historical endpoint is a good next step once you have a paid/free-tier
key, and the shape to fill in is `getHistoricalData()` in
`services/marketDataService.js`.

## Razorpay test mode

This is a **simulated purchase flow**, not a real brokerage integration.

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Use your Razorpay **Test Mode** key id/secret only (from the Razorpay
dashboard). Flow:

1. On a stock's detail page, choose "Buy in test mode" and enter a quantity.
2. Frontend calls `POST /api/payments/create-order` with `{ symbol, quantity }`
   only - the backend fetches the latest price itself and computes the total,
   so the browser can never set the price.
3. Razorpay's checkout script opens (test mode).
4. On completion, the frontend sends the returned order/payment/signature to
   `POST /api/payments/verify`.
5. The backend verifies the HMAC signature server-side. Only if valid does it
   create/extend a holding (weighted-average buy price) and mark the payment
   `SUCCESS`. Verifying the same order twice does not create a second
   holding (idempotent by `orderId`).

If `RAZORPAY_KEY_ID`/`SECRET` are not set, "Buy in test mode" returns a clear
503 message instead of failing silently.

## AI financial assistant

```env
AI_API_KEY=
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

Endpoints (`/api/ai/portfolio`, `/api/ai/expenses`, `/api/ai/stock/:symbol`)
gather only the fields needed for that analysis (never passwords, tokens, or
payment data) and call an OpenAI-compatible chat completions endpoint. With
no `AI_API_KEY` set, every call returns a clearly labeled "not configured"
response instead of erroring, and the rest of the app is unaffected. If the
AI call fails at request time, the same graceful fallback applies.

## Local setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev             # or: npm start
```

Requires a running MongoDB instance (local `mongod` or an Atlas connection
string in `MONGO_URI`).

### 2. Frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_URL should point at the backend
npm install
npm run dev
```

Visit the printed local URL (default `http://localhost:5173`).

## Known limitations / honest notes

- Historical price charts are simulated from the latest quote unless you
  extend `getHistoricalData()` for your chosen provider's real history
  endpoint.
- Symbol search without a configured provider simply echoes back what you
  typed (there is no free-tier "search a universe of symbols" without a key).
- Technical indicators (SMA/EMA/RSI/MACD) are not implemented yet - the
  market data abstraction is structured so they can be added as pure
  functions over `getHistoricalData()` output.
- No automated test suite is included in this pass. Business-critical logic
  worth testing first: portfolio P&L calculation (`investmentController`,
  `paymentController`), the recurring-transaction job, and Razorpay signature
  verification (`services/paymentService.js`).
- No seed/demo data script is included; create a user via `/signup` and add
  a few transactions/investments to see the dashboard populate.
