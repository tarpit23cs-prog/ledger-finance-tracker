# API Reference

Base URL: `http://localhost:5000/api`

All responses follow `{ success: boolean, data?, message? }`.
All routes except `/auth/signup` and `/auth/login` require:
`Authorization: Bearer <jwt>`

## Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /auth/signup | `{ name, email, password }` | Returns `{ token, user }` |
| POST | /auth/login | `{ email, password }` | Returns `{ token, user }` |
| GET | /auth/me | - | Current user |
| PUT | /auth/me | `{ name?, currency?, theme?, budgetAlerts? }` | Update profile/preferences |
| PUT | /auth/password | `{ currentPassword, newPassword }` | Change password |

## Transactions

| Method | Path | Notes |
|---|---|---|
| GET | /transactions | Query: `page, limit, type, category, search, startDate, endDate, minAmount, maxAmount` |
| POST | /transactions | `{ type, amount, category, description?, date?, isRecurring?, frequency? }` |
| GET | /transactions/:id | |
| PUT | /transactions/:id | |
| DELETE | /transactions/:id | |

## Investments (holdings)

| Method | Path | Notes |
|---|---|---|
| GET | /investments | Returns holdings with live-calculated `currentPrice/investedValue/currentValue/gainLoss/gainLossPercent` |
| POST | /investments | `{ symbol, quantity, buyPrice, buyDate? }` |
| PUT | /investments/:id | |
| DELETE | /investments/:id | |

## Budgets

| Method | Path | Notes |
|---|---|---|
| GET | /budgets | Query: `month (0-11), year` |
| POST | /budgets | `{ category, amount, month, year }` (upsert) |
| PUT | /budgets/:id | `{ amount }` |
| DELETE | /budgets/:id | |

## Dashboard

| Method | Path | Notes |
|---|---|---|
| GET | /dashboard | Aggregated summary: balance, income, expenses, investments, 6-month trend, category spending, recent transactions, portfolio summary |

## Reports

| Method | Path | Notes |
|---|---|---|
| GET | /reports/summary | Query: `startDate?, endDate?` (default: last 6 months) |
| GET | /reports/income | Monthly income trend |
| GET | /reports/expenses | Monthly trend + category breakdown |
| GET | /reports/investments | Per-holding invested/current/P&L + totals |

## Stocks (market data)

| Method | Path | Notes |
|---|---|---|
| GET | /stocks/search?q= | Symbol/company search |
| GET | /stocks/compare?symbols=A,B | Quotes + 6M history for each |
| GET | /stocks/:symbol/quote | Normalized `{ symbol, name, price, change, changePercent, volume, lastUpdated, freshness }` |
| GET | /stocks/:symbol/history?period=1M | period: 1D/1W/1M/6M/1Y/5Y |
| GET | /stocks/:symbol/fundamentals | `{ available, ...metrics }` or `{ available: false, message: "Data unavailable" }` |

## Watchlist

| Method | Path | Notes |
|---|---|---|
| GET | /watchlist | Each item includes its latest `quote` |
| POST | /watchlist | `{ symbol, name? }` (upsert) |
| DELETE | /watchlist/:id | |

## Payments (Razorpay test mode)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /payments/create-order | `{ symbol, quantity }` | Backend fetches price + creates a Razorpay test order. Returns `{ keyId, orderId, amount, currency, price, totalAmount, ... }` |
| POST | /payments/verify | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | Verifies signature server-side, then creates/extends a holding. Idempotent per `orderId`. |
| GET | /payments | List the user's recent payments |
| GET | /payments/:id | Single payment |

## AI assistant

| Method | Path | Notes |
|---|---|---|
| POST | /ai/portfolio | Analyzes the caller's current holdings |
| POST | /ai/expenses | Analyzes current vs previous month expenses |
| POST | /ai/stock/:symbol | Explains a stock's quote + fundamentals |

All three return `{ available: boolean, summary, ... }`. `available: false`
means no `AI_API_KEY` is configured (or the AI call failed) - the message is
always a clear, honest explanation rather than a generic error.

## Error format

```json
{ "success": false, "message": "Human-readable message" }
```
