import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { EmptyState, ErrorState } from "../components/StateBlocks";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { formatCurrency } from "../components/StatCard";
import { transactionsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Rent", "Health", "Salary", "Other"];

const emptyForm = {
  type: "expense",
  amount: "",
  category: "Food",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  isRecurring: false,
  frequency: "monthly",
};

export default function Transactions() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ type: "", category: "", search: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = (page = 1) => {
    setLoading(true);
    setError("");
    const params = { page, limit: 10, ...filters };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);

    transactionsApi
      .list(params)
      .then((res) => {
        setItems(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description || "",
      date: t.date.slice(0, 10),
      isRecurring: t.isRecurring,
      frequency: t.frequency,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) {
      showToast("Amount and category are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) {
        await transactionsApi.update(editing._id, payload);
        showToast("Transaction updated", "success");
      } else {
        await transactionsApi.create(payload);
        showToast("Transaction added", "success");
      }
      setModalOpen(false);
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await transactionsApi.remove(deleteTarget._id);
      showToast("Transaction deleted", "success");
      setDeleteTarget(null);
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const income = items.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="All your income and expenses"
        action={
          <button className="btn btn-primary" onClick={openCreate}>
            + Add transaction
          </button>
        }
      />

      <div className="grid grid-3 mb-4">
        <div className="card stat-card">
          <span className="stat-label">Income (this page)</span>
          <span className="stat-value">{formatCurrency(income)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Expenses (this page)</span>
          <span className="stat-value">{formatCurrency(expense)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Net (this page)</span>
          <span className="stat-value">{formatCurrency(income - expense)}</span>
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid grid-3">
          <input
            className="input"
            placeholder="Search description"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <select
            className="select"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            className="select"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(pagination.page)} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Add your first transaction to start tracking your finances."
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                + Add transaction
              </button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th className="text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t._id}>
                      <td>{new Date(t.date).toLocaleDateString()}</td>
                      <td>{t.description || "-"}</td>
                      <td>{t.category}</td>
                      <td>
                        <span className={`badge ${t.type === "income" ? "badge-income" : "badge-expense"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="text-right">
                        {t.type === "expense" ? "-" : "+"}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(t)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              onChange={load}
            />
          </>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? "Edit transaction" : "Add transaction"}
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
              <label>Type</label>
              <select
                className="select"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
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
              <label>Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Note</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="checkbox-row mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={form.isRecurring}
                onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
              />
              <label htmlFor="isRecurring">Recurring</label>
            </div>
            {form.isRecurring && (
              <div className="field">
                <label>Frequency</label>
                <select
                  className="select"
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete transaction"
          message={`Delete "${deleteTarget.description || deleteTarget.category}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
