import api from "./client";

export const authApi = {
  signup: (payload) => api.post("/auth/signup", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  updateMe: (payload) => api.put("/auth/me", payload),
  changePassword: (payload) => api.put("/auth/password", payload),
};

export const transactionsApi = {
  list: (params) => api.get("/transactions", { params }),
  get: (id) => api.get(`/transactions/${id}`),
  create: (payload) => api.post("/transactions", payload),
  update: (id, payload) => api.put(`/transactions/${id}`, payload),
  remove: (id) => api.delete(`/transactions/${id}`),
};

export const investmentsApi = {
  list: () => api.get("/investments"),
  create: (payload) => api.post("/investments", payload),
  update: (id, payload) => api.put(`/investments/${id}`, payload),
  remove: (id) => api.delete(`/investments/${id}`),
};

export const budgetsApi = {
  list: (params) => api.get("/budgets", { params }),
  create: (payload) => api.post("/budgets", payload),
  update: (id, payload) => api.put(`/budgets/${id}`, payload),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const dashboardApi = {
  get: () => api.get("/dashboard"),
};

export const reportsApi = {
  summary: (params) => api.get("/reports/summary", { params }),
  income: (params) => api.get("/reports/income", { params }),
  expenses: (params) => api.get("/reports/expenses", { params }),
  investments: () => api.get("/reports/investments"),
};

export const stocksApi = {
  search: (q) => api.get("/stocks/search", { params: { q } }),
  quote: (symbol) => api.get(`/stocks/${symbol}/quote`),
  history: (symbol, period) => api.get(`/stocks/${symbol}/history`, { params: { period } }),
  fundamentals: (symbol) => api.get(`/stocks/${symbol}/fundamentals`),
  compare: (symbols) => api.get("/stocks/compare", { params: { symbols: symbols.join(",") } }),
};

export const watchlistApi = {
  list: () => api.get("/watchlist"),
  add: (payload) => api.post("/watchlist", payload),
  remove: (id) => api.delete(`/watchlist/${id}`),
};

export const paymentsApi = {
  createOrder: (payload) => api.post("/payments/create-order", payload),
  verify: (payload) => api.post("/payments/verify", payload),
  list: () => api.get("/payments"),
};

export const aiApi = {
  portfolio: () => api.post("/ai/portfolio"),
  expenses: () => api.post("/ai/expenses"),
  stock: (symbol) => api.post(`/ai/stock/${symbol}`),
};
