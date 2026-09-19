import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard, { formatCurrency } from "../components/StatCard";
import Loading from "../components/Loading";
import { ErrorState } from "../components/StateBlocks";
import AIInsightCard from "../components/AIInsightCard";
import { dashboardApi, aiApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { Link } from "react-router-dom";

const CATEGORY_COLORS = ["#2f5233", "#6b7280", "#b45309", "#3f3f46", "#15803d", "#9ca3af"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    dashboardApi
      .get()
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAnalyze = async () => {
    setAiLoading(true);
    try {
      const res = await aiApi.portfolio();
      setAiResult(res.data.data);
    } catch (err) {
      setAiResult({ available: false, summary: "AI insights are temporarily unavailable." });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <Loading label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Dashboard" description="Your financial and investment overview" />

      <div className="grid grid-4 mb-4">
        <StatCard label="Balance" value={data.balance} />
        <StatCard label="Income (this month)" value={data.income} />
        <StatCard label="Expenses (this month)" value={data.expenses} />
        <StatCard label="Investments" value={data.investments} />
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-title">Income vs expenses</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyIncomeExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="income" fill="#2f5233" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#b91c1c" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Spending by category</div>
          {data.categorySpending.length === 0 ? (
            <p className="text-sm text-muted">No expenses recorded this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.categorySpending}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {data.categorySpending.map((entry, i) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="card-title" style={{ marginBottom: 0 }}>
              Recent transactions
            </span>
            <Link to="/transactions" className="text-sm text-muted">
              View all
            </Link>
          </div>
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted">No transactions yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {data.recentTransactions.map((t) => (
                    <tr key={t._id}>
                      <td>{new Date(t.date).toLocaleDateString()}</td>
                      <td>{t.description || t.category}</td>
                      <td>
                        <span className={`badge ${t.type === "income" ? "badge-income" : "badge-expense"}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className="text-right">
                        {t.type === "expense" ? "-" : "+"}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="card-title" style={{ marginBottom: 0 }}>
              Portfolio overview
            </span>
            <Link to="/portfolio" className="text-sm text-muted">
              View portfolio
            </Link>
          </div>
          <div className="grid grid-2 gap-3">
            <div>
              <span className="stat-label">Invested</span>
              <p className="stat-value" style={{ fontSize: 18 }}>
                {formatCurrency(data.portfolioSummary.invested)}
              </p>
            </div>
            <div>
              <span className="stat-label">Current value</span>
              <p className="stat-value" style={{ fontSize: 18 }}>
                {formatCurrency(data.portfolioSummary.currentValue)}
              </p>
            </div>
            <div>
              <span className="stat-label">Return</span>
              <p
                className="stat-value"
                style={{ fontSize: 18, color: data.portfolioSummary.return >= 0 ? "#15803d" : "#b91c1c" }}
              >
                {formatCurrency(data.portfolioSummary.return)}
              </p>
            </div>
            <div>
              <span className="stat-label">Return %</span>
              <p
                className="stat-value"
                style={{ fontSize: 18, color: data.portfolioSummary.returnPercent >= 0 ? "#15803d" : "#b91c1c" }}
              >
                {data.portfolioSummary.returnPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <AIInsightCard
        title="AI portfolio insight"
        result={aiResult}
        loading={aiLoading}
        onRequest={handleAnalyze}
      />
    </div>
  );
}
