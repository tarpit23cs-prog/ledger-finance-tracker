import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { EmptyState, ErrorState } from "../components/StateBlocks";
import Modal from "../components/Modal";
import { formatCurrency } from "../components/StatCard";
import { budgetsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Rent", "Health", "Other"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Budgets() {
  const { showToast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ category: "Food", amount: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    budgetsApi
      .list({ month, year })
      .then((res) => setItems(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [month, year]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount) {
      showToast("Amount is required", "error");
      return;
    }
    setSaving(true);
    try {
      await budgetsApi.create({ category: form.category, amount: Number(form.amount), month, year });
      showToast("Budget saved", "success");
      setModalOpen(false);
      setForm({ category: "Food", amount: "" });
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await budgetsApi.remove(id);
      showToast("Budget removed", "success");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const totalBudget = items.reduce((s, b) => s + b.amount, 0);
  const totalSpent = items.reduce((s, b) => s + b.spent, 0);

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set monthly spending limits by category"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Set budget
          </button>
        }
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <select className="select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select className="select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-3 mb-4">
        <div className="card stat-card">
          <span className="stat-label">Total budget</span>
          <span className="stat-value">{formatCurrency(totalBudget)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total spent</span>
          <span className="stat-value">{formatCurrency(totalSpent)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Remaining</span>
          <span className="stat-value">{formatCurrency(totalBudget - totalSpent)}</span>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No budgets set for this month"
            description="Set a category budget to track how much you have left to spend."
            action={
              <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                + Set budget
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-3">
          {items.map((b) => (
            <div className="card" key={b._id}>
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontWeight: 600 }}>{b.category}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(b._id)}>
                  Remove
                </button>
              </div>
              <p className="text-sm text-muted mb-2">
                {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
              </p>
              <div className="progress-track mb-2">
                <div
                  className={`progress-fill ${b.status}`}
                  style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                />
              </div>
              <span
                className={`badge ${
                  b.status === "exceeded" ? "badge-expense" : b.status === "warning" ? "badge-warning" : "badge-neutral"
                }`}
              >
                {b.percentUsed.toFixed(0)}% used
              </span>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title="Set budget"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          }
        >
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Category</label>
              <select
                className="select"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Monthly amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
