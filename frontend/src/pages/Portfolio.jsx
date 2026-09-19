import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { EmptyState, ErrorState } from "../components/StateBlocks";
import { formatCurrency } from "../components/StatCard";
import { investmentsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";

const COLORS = ["#2f5233", "#6b7280", "#b45309", "#3f3f46", "#15803d", "#9ca3af", "#b91c1c"];

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    investmentsApi
      .list()
      .then((res) => setHoldings(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Loading label="Loading portfolio..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (holdings.length === 0) {
    return (
      <div>
        <PageHeader title="Portfolio" description="Allocation and performance across your holdings" />
        <div className="card">
          <EmptyState
            title="No investments yet"
            description="Add a simulated investment or buy a stock in test mode to see portfolio analytics here."
          />
        </div>
      </div>
    );
  }

  const totals = holdings.reduce(
    (acc, h) => ({
      invested: acc.invested + h.investedValue,
      current: acc.current + h.currentValue,
      gainLoss: acc.gainLoss + h.gainLoss,
    }),
    { invested: 0, current: 0, gainLoss: 0 }
  );
  const returnPercent = totals.invested > 0 ? (totals.gainLoss / totals.invested) * 100 : 0;

  const allocation = holdings.map((h) => ({
    symbol: h.symbol,
    value: h.currentValue,
    percent: totals.current > 0 ? (h.currentValue / totals.current) * 100 : 0,
  }));

  const sorted = [...holdings].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const topHolding = [...allocation].sort((a, b) => b.percent - a.percent)[0];

  return (
    <div>
      <PageHeader title="Portfolio" description="Allocation and performance across your tracked holdings" />

      <div className="grid grid-4 mb-4">
        <div className="card stat-card">
          <span className="stat-label">Portfolio value</span>
          <span className="stat-value">{formatCurrency(totals.current)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total invested</span>
          <span className="stat-value">{formatCurrency(totals.invested)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total P&amp;L</span>
          <span className="stat-value" style={{ color: totals.gainLoss >= 0 ? "#15803d" : "#b91c1c" }}>
            {formatCurrency(totals.gainLoss)}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Return</span>
          <span className="stat-value" style={{ color: returnPercent >= 0 ? "#15803d" : "#b91c1c" }}>
            {returnPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-title">Allocation by holding</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={allocation} dataKey="value" nameKey="symbol" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {allocation.map((entry, i) => (
                  <Cell key={entry.symbol} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Insights</div>
          <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <li className="text-sm">
              <strong>{topHolding?.symbol}</strong> represents approximately{" "}
              {topHolding?.percent.toFixed(0)}% of your tracked portfolio.
            </li>
            <li className="text-sm">
              Best performer: <strong>{best?.symbol}</strong> ({best?.gainLossPercent.toFixed(1)}%)
            </li>
            <li className="text-sm">
              Worst performer: <strong>{worst?.symbol}</strong> ({worst?.gainLossPercent.toFixed(1)}%)
            </li>
            <li className="text-sm text-muted">
              These are factual observations based on your tracked data, not investment advice.
            </li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Holdings</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Avg buy price</th>
                <th>Current price</th>
                <th>Current value</th>
                <th>Return %</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h._id}>
                  <td style={{ fontWeight: 600 }}>{h.symbol}</td>
                  <td>{h.quantity}</td>
                  <td>{formatCurrency(h.buyPrice)}</td>
                  <td>{formatCurrency(h.currentPrice)}</td>
                  <td>{formatCurrency(h.currentValue)}</td>
                  <td style={{ color: h.gainLossPercent >= 0 ? "#15803d" : "#b91c1c" }}>
                    {h.gainLossPercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
