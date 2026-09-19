import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { EmptyState, ErrorState } from "../components/StateBlocks";
import { formatCurrency } from "../components/StatCard";
import { watchlistApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";

export default function Watchlist() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [symbolInput, setSymbolInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    watchlistApi
      .list()
      .then((res) => setItems(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;
    try {
      await watchlistApi.add({ symbol: symbolInput.trim().toUpperCase() });
      setSymbolInput("");
      showToast("Added to watchlist", "success");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handleRemove = async (id) => {
    try {
      await watchlistApi.remove(id);
      showToast("Removed from watchlist", "success");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Watchlist" description="Symbols you are keeping an eye on" />

      <div className="card mb-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            className="input"
            placeholder="Add a symbol, e.g. TCS"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState title="Your watchlist is empty" description="Add a symbol above or from a stock's detail page." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Latest price</th>
                  <th>Change %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600 }}>{item.symbol}</td>
                    <td>{item.quote ? formatCurrency(item.quote.price) : "-"}</td>
                    <td style={{ color: (item.quote?.changePercent || 0) >= 0 ? "#15803d" : "#b91c1c" }}>
                      {item.quote?.changePercent !== undefined ? `${item.quote.changePercent.toFixed(2)}%` : "-"}
                    </td>
                    <td className="text-right">
                      <Link to={`/stocks/${item.symbol}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemove(item._id)}>
                        Remove
                      </button>
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
