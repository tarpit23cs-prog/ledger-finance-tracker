import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { ErrorState } from "../components/StateBlocks";
import Modal from "../components/Modal";
import AIInsightCard from "../components/AIInsightCard";
import { formatCurrency } from "../components/StatCard";
import { stocksApi, watchlistApi, paymentsApi, aiApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";

const PERIODS = ["1D", "1W", "1M", "6M", "1Y", "5Y"];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function StockDetail() {
  const { symbol } = useParams();
  const { showToast } = useToast();

  const [quote, setQuote] = useState(null);
  const [fundamentals, setFundamentals] = useState(null);
  const [history, setHistory] = useState(null);
  const [period, setPeriod] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [buyOpen, setBuyOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError("");
    Promise.all([stocksApi.quote(symbol), stocksApi.fundamentals(symbol), stocksApi.history(symbol, period)])
      .then(([q, f, h]) => {
        setQuote(q.data.data);
        setFundamentals(f.data.data);
        setHistory(h.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, [symbol]);

  useEffect(() => {
    stocksApi
      .history(symbol, period)
      .then((h) => setHistory(h.data.data))
      .catch(() => {});
  }, [period, symbol]);

  const handleAddWatchlist = async () => {
    try {
      await watchlistApi.add({ symbol, name: symbol });
      showToast("Added to watchlist", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handleAnalyze = async () => {
    setAiLoading(true);
    try {
      const res = await aiApi.stock(symbol);
      setAiResult(res.data.data);
    } catch (err) {
      setAiResult({ available: false, summary: "AI insights are temporarily unavailable." });
    } finally {
      setAiLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!quantity || quantity <= 0) {
      showToast("Enter a valid quantity", "error");
      return;
    }
    setBuying(true);
    try {
      const orderRes = await paymentsApi.createOrder({ symbol, quantity: Number(quantity) });
      const order = orderRes.data.data;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Could not load Razorpay checkout. Check your connection.", "error");
        setBuying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Ledger - Simulated Purchase (Test Mode)",
        description: `${order.quantity} x ${order.symbol} @ ${formatCurrency(order.price)}`,
        handler: async (response) => {
          try {
            await paymentsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast("Simulated purchase completed", "success");
            setBuyOpen(false);
          } catch (err) {
            showToast(getErrorMessage(err), "error");
          }
        },
        modal: {
          ondismiss: () => setBuying(false),
        },
        theme: { color: "#2f5233" },
      });

      rzp.on("payment.failed", () => {
        showToast("Test payment failed or was declined", "error");
        setBuying(false);
      });

      rzp.open();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setBuying(false);
    }
  };

  if (loading) return <Loading label="Loading stock..." />;
  if (error) return <ErrorState message={error} onRetry={loadAll} />;
  if (!quote) return null;

  const estimatedTotal = quote.price * Number(quantity || 0);

  return (
    <div>
      <PageHeader
        title={quote.symbol}
        description={quote.freshness}
        action={
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={handleAddWatchlist}>
              Add to watchlist
            </button>
            <button className="btn btn-primary" onClick={() => setBuyOpen(true)}>
              Buy in test mode
            </button>
          </div>
        }
      />

      <div className="grid grid-4 mb-4">
        <div className="card stat-card">
          <span className="stat-label">Latest price</span>
          <span className="stat-value">{formatCurrency(quote.price)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Change</span>
          <span className="stat-value" style={{ color: quote.change >= 0 ? "#15803d" : "#b91c1c" }}>
            {quote.change?.toFixed ? quote.change.toFixed(2) : quote.change}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Change %</span>
          <span className="stat-value" style={{ color: quote.changePercent >= 0 ? "#15803d" : "#b91c1c" }}>
            {quote.changePercent?.toFixed ? quote.changePercent.toFixed(2) : quote.changePercent}%
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Last updated</span>
          <span className="stat-value" style={{ fontSize: 14 }}>
            {new Date(quote.lastUpdated).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="card-title" style={{ marginBottom: 0 }}>
            Price history
          </span>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${period === p ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {history && (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={history.points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => new Date(d).toLocaleDateString()}
                minTickGap={40}
              />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleString()}
                formatter={(v) => formatCurrency(v)}
              />
              <Line type="monotone" dataKey="price" stroke="#2f5233" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="text-sm text-faint mt-2">{history?.freshness}</p>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-title">Fundamentals</div>
          {fundamentals?.available ? (
            <div className="grid grid-2 gap-3">
              <div>
                <span className="stat-label">Market cap</span>
                <p className="text-sm">{fundamentals.marketCap || "Data unavailable"}</p>
              </div>
              <div>
                <span className="stat-label">P/E</span>
                <p className="text-sm">{fundamentals.peRatio || "Data unavailable"}</p>
              </div>
              <div>
                <span className="stat-label">EPS</span>
                <p className="text-sm">{fundamentals.eps || "Data unavailable"}</p>
              </div>
              <div>
                <span className="stat-label">Dividend yield</span>
                <p className="text-sm">{fundamentals.dividendYield || "Data unavailable"}</p>
              </div>
              <div>
                <span className="stat-label">52-week high</span>
                <p className="text-sm">{fundamentals.week52High || "Data unavailable"}</p>
              </div>
              <div>
                <span className="stat-label">52-week low</span>
                <p className="text-sm">{fundamentals.week52Low || "Data unavailable"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Data unavailable. Configure MARKET_API_PROVIDER=alphavantage with a MARKET_API_KEY to enable
              fundamentals.
            </p>
          )}
        </div>

        <AIInsightCard
          title="AI research"
          result={aiResult}
          loading={aiLoading}
          onRequest={handleAnalyze}
        />
      </div>

      {buyOpen && (
        <Modal
          title={`Buy ${quote.symbol} (test mode)`}
          onClose={() => setBuyOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setBuyOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleBuy} disabled={buying}>
                {buying ? "Opening checkout..." : "Purchase in test mode"}
              </button>
            </>
          }
        >
          <p className="text-sm text-muted mb-4">
            This is a simulated purchase using Razorpay test mode. No real money is charged and no shares
            are actually purchased from an exchange.
          </p>
          <div className="field">
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              step="1"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="card" style={{ background: "#fafafa" }}>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Latest price</span>
              <span>{formatCurrency(quote.price)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Quantity</span>
              <span>{quantity || 0}</span>
            </div>
            <div className="flex justify-between" style={{ fontWeight: 600 }}>
              <span>Estimated total</span>
              <span>{formatCurrency(estimatedTotal)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
