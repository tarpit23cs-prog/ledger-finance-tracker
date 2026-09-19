export default function Loading({ label = "Loading..." }) {
  return (
    <div className="state-block">
      <div className="spinner" style={{ marginBottom: 12 }} />
      <p>{label}</p>
    </div>
  );
}
