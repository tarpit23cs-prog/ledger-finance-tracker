import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { EmptyState } from "../components/StateBlocks";
import { stocksApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";

const POPULAR = ["TCS", "INFY", "RELIANCE", "HDFCBANK", "AAPL", "MSFT"];

export default function Stocks() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providerConfigured, setProviderConfigured] = useState(true);

  const runSearch = async (q) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await stocksApi.search(q.trim());
      setResults(res.data.data);
      setProviderConfigured(res.data.providerConfigured);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  return (
    <div>
      <PageHeader title="Stocks" description="Search the market and open a symbol for details" />

      <div className="card mb-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="input"
            placeholder="Search by symbol or company name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </form>
        {!providerConfigured && results && (
          <p className="text-sm text-muted mt-2">
            No market data provider is configured (MARKET_API_KEY), so search returns your typed symbol
            directly rather than a full company lookup. Prices still work through the simulated price
            engine.
          </p>
        )}
      </div>

      {loading && <Loading label="Searching..." />}

      {!loading && results && (
        <div className="card">
          {results.length === 0 ? (
            <EmptyState title="No matches" description="Try a different symbol or company name." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.symbol}>
                      <td style={{ fontWeight: 600 }}>{r.symbol}</td>
                      <td>{r.name}</td>
                      <td className="text-right">
                        <Link to={`/stocks/${r.symbol}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!results && (
        <div className="card">
          <div className="card-title">Popular symbols</div>
          <div className="grid grid-3">
            {POPULAR.map((symbol) => (
              <Link key={symbol} to={`/stocks/${symbol}`} className="feature-card" style={{ textAlign: "center" }}>
                <span style={{ fontWeight: 600 }}>{symbol}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {error && <p className="field-error mt-2">{error}</p>}
    </div>
  );
}
