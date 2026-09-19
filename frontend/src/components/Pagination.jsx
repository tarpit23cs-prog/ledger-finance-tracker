export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <div className="pagination">
      <span>
        Page {page} of {pages} - {total} total
      </span>
      <div className="pagination-controls">
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
