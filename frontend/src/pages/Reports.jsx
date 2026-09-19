import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { ErrorState } from "../components/StateBlocks";
import { formatCurrency } from "../components/StatCard";
import { reportsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";

const MONTH_LABEL = (item) =>
  new Date(item._id.year, item._id.month - 1).toLocaleString("default", { month: "short", year: "2-digit" });

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState(null);
  const [investments, setInvestments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      reportsApi.summary(),
      reportsApi.income(),
      reportsApi.expenses(),
      reportsApi.investments(),
    ])
      .then(([s, i, e, inv]) => {
        setSummary(s.data.data);
        setIncome(i.data.data);
        setExpenses(e.data.data);
        setInvestments(inv.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const exportCsv = () => {
    if (!expenses) return;
    const rows = [["Category", "Total"], ...expenses.byCategory.map((c) => [c.category, c.total])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading label="Building reports..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const incomeSeries = income.map((i) => ({ month: MONTH_LABEL(i), total: i.total }));
  const expenseSeries = expenses.trend.map((i) => ({ month: MONTH_LABEL(i), total: i.total }));

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Income, expense, and investment analysis over time"
        action={
          <button className="btn btn-secondary" onClick={exportCsv}>
            Export CSV
          </button>
        }
      />

      <div className="grid grid-3 mb-4">
        <div className="card stat-card">
          <span className="stat-label">Income (6mo)</span>
          <span className="stat-value">{formatCurrency(summary.income)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Expenses (6mo)</span>
          <span className="stat-value">{formatCurrency(summary.expenses)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Savings (6mo)</span>
          <span className="stat-value">{formatCurrency(summary.savings)}</span>
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-title">Income trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={incomeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="total" stroke="#2f5233" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Expense breakdown by category</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expenses.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#b91c1c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-title">Savings trend</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={incomeSeries.map((i, idx) => ({
              month: i.month,
              savings: i.total - (expenseSeries[idx]?.total || 0),
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Line type="monotone" dataKey="savings" stroke="#3f3f46" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-title">Investment performance</div>
        {investments.rows.length === 0 ? (
          <p className="text-sm text-muted">No investments tracked yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Invested</th>
                  <th>Current value</th>
                  <th>Gain / loss</th>
                </tr>
              </thead>
              <tbody>
                {investments.rows.map((r) => (
                  <tr key={r.symbol}>
                    <td style={{ fontWeight: 600 }}>{r.symbol}</td>
                    <td>{formatCurrency(r.invested)}</td>
                    <td>{formatCurrency(r.currentValue)}</td>
                    <td style={{ color: r.gainLoss >= 0 ? "#15803d" : "#b91c1c" }}>
                      {formatCurrency(r.gainLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
