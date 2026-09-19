import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { EmptyState, ErrorState } from "../components/StateBlocks";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatCurrency } from "../components/StatCard";
import { investmentsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";

const emptyForm = { symbol: "", quantity: "", buyPrice: "", buyDate: new Date().toISOString().slice(0, 10) };

export default function Investments() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    investmentsApi
      .list()
      .then((res) => setItems(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (h) => {
    setEditing(h);
    setForm({
      symbol: h.symbol,
      quantity: h.quantity,
      buyPrice: h.buyPrice,
      buyDate: h.buyDate.slice(0, 10),
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.symbol || !form.quantity || !form.buyPrice) {
      showToast("Symbol, quantity and buy price are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity), buyPrice: Number(form.buyPrice) };
      if (editing) {
        await investmentsApi.update(editing._id, payload);
        showToast("Investment updated", "success");
      } else {
        await investmentsApi.create(payload);
        showToast("Investment added", "success");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await investmentsApi.remove(deleteTarget._id);
      showToast("Investment removed", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const totals = items.reduce(
    (acc, h) => ({
      invested: acc.invested + h.investedValue,
      current: acc.current + h.currentValue,
      gainLoss: acc.gainLoss + h.gainLoss,
    }),
    { invested: 0, current: 0, gainLoss: 0 }
  );
  const returnPercent = totals.invested > 0 ? (totals.gainLoss / totals.invested) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Investments"
        description="Holdings you are tracking, valued at the latest available price"
        action={
          <button className="btn btn-primary" onClick={openCreate}>
            + Add investment
          </button>
        }
      />

      <div className="grid grid-4 mb-4">
        <div className="card stat-card">
          <span className="stat-label">Total invested</span>
          <span className="stat-value">{formatCurrency(totals.invested)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Current value</span>
          <span className="stat-value">{formatCurrency(totals.current)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Gain / loss</span>
          <span className="stat-value" style={{ color: totals.gainLoss >= 0 ? "#15803d" : "#b91c1c" }}>
            {formatCurrency(totals.gainLoss)}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Return</span>
          <span className="stat-value" style={{ color: returnPercent >= 0 ? "#15803d" : "#b91c1c" }}>
            {returnPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No investments yet"
            description="Add your first simulated investment to start tracking performance, or buy one from the Stocks page."
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                + Add investment
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Buy price</th>
                  <th>Current price</th>
                  <th>Invested</th>
                  <th>Current value</th>
                  <th>Gain / loss</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => (
                  <tr key={h._id}>
                    <td style={{ fontWeight: 600 }}>{h.symbol}</td>
                    <td>{h.quantity}</td>
                    <td>{formatCurrency(h.buyPrice)}</td>
                    <td>{formatCurrency(h.currentPrice)}</td>
                    <td>{formatCurrency(h.investedValue)}</td>
                    <td>{formatCurrency(h.currentValue)}</td>
                    <td style={{ color: h.gainLoss >= 0 ? "#15803d" : "#b91c1c" }}>
                      {formatCurrency(h.gainLoss)} ({h.gainLossPercent.toFixed(1)}%)
                    </td>
                    <td className="text-right">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(h)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(h)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? "Edit investment" : "Add investment"}
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
              <label>Stock symbol</label>
              <input
                className="input"
                placeholder="e.g. TCS"
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                disabled={!!editing}
              />
            </div>
            <div className="field">
              <label>Quantity</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                className="input"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Buy price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.buyPrice}
                onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Buy date</label>
              <input
                type="date"
                className="input"
                value={form.buyDate}
                onChange={(e) => setForm((f) => ({ ...f, buyDate: e.target.value }))}
              />
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove investment"
          message={`Remove ${deleteTarget.symbol} from your tracked holdings?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
