const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    value || 0
  );

export default function StatCard({ label, value, delta, isCurrency = true, currency }) {
  return (
    <div className="card stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{isCurrency ? formatCurrency(value, currency) : value}</span>
      {delta !== undefined && delta !== null && (
        <span className={`stat-delta ${delta >= 0 ? "positive" : "negative"}`}>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

export { formatCurrency };
