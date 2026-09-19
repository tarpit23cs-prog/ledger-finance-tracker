export default function AIInsightCard({ title = "AI Insight", result, loading, onRequest }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span className="card-title" style={{ marginBottom: 0 }}>
          {title}
        </span>
        {onRequest && (
          <button className="btn btn-secondary btn-sm" onClick={onRequest} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze with AI"}
          </button>
        )}
      </div>

      {!result && !loading && (
        <p className="text-sm text-muted">Request an AI-generated summary based on your data.</p>
      )}

      {loading && <p className="text-sm text-muted">Gathering your data and generating insight...</p>}

      {result && !result.available && (
        <p className="text-sm text-muted">{result.summary}</p>
      )}

      {result && result.available && (
        <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>
          {result.summary}
        </p>
      )}
    </div>
  );
}
