export function EmptyState({ title, description, action }) {
  return (
    <div className="state-block">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Unable to load data. Please try again.", onRetry }) {
  return (
    <div className="state-block">
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary mt-4" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
