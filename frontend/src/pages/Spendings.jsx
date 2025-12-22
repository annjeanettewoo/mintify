// src/pages/Spendings.jsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchTransactions,
  updateTransaction,
  deleteTransaction,
} from "../services/financeApi";
import "./Spendings.css";

function Spendings() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [periodLabel] = useState("This month"); // you can add a real filter later

  // edit modal state
  const [editingTx, setEditingTx] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const categoriesOptions = [
    "Food",
    "Groceries",
    "Entertainment",
    "Travel",
    "Shopping",
    "Other",
  ];

  // ---------- load transactions ----------
  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError("Could not load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // --- Derived values ---

  const totals = useMemo(() => {
    if (!transactions.length) {
      return {
        total: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        byCategory: {},
      };
    }

    const byCategory = {};
    let total = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;

      // Here we assume expenses are positive numbers.
      // If your backend uses negative for expenses, use Math.abs(amount).
      total += amount;

      const cat = tx.category || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    });

    // Very rough breakdown – adjust if you have real date ranges
    const daily = total / 30;
    const weekly = total / 4;
    const monthly = total;

    return { total, daily, weekly, monthly, byCategory };
  }, [transactions]);

  const latestTransactions = useMemo(
    () => transactions.slice(0, 6),
    [transactions]
  );

  const categoryList = useMemo(() => {
    const entries = Object.entries(totals.byCategory);
    if (!entries.length) return [];
    const max = Math.max(...entries.map(([_, v]) => v || 0)) || 1;

    return entries.map(([name, value]) => ({
      name,
      value,
      barWidth: (value / max) * 100,
    }));
  }, [totals.byCategory]);

  // ---------- edit & delete handlers ----------

  const startEdit = (tx) => {
    setEditError(null);
    setEditingTx({
      ...tx,
      amount: Number(tx.amount) || 0,
      date: tx.date ? tx.date.slice(0, 10) : "",
      type: tx.type || "expense",
      category: tx.category || "Other",
      description: tx.description || "",
    });
  };

  const handleEditFieldChange = (field, value) => {
    setEditingTx((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTx) return;

    const id = editingTx._id || editingTx.id;
    if (!id) {
      setEditError("Missing transaction id");
      return;
    }

    try {
      setEditSaving(true);
      setEditError(null);

      await updateTransaction(id, {
        type: editingTx.type,
        amount: editingTx.amount,
        category: editingTx.category,
        date: editingTx.date,
        description: editingTx.description,
      });

      await loadTransactions();
      setEditingTx(null);
    } catch (err) {
      console.error("Failed to update transaction:", err);
      setEditError("Could not update transaction. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (tx) => {
    const id = tx._id || tx.id;
    if (!id) return;

    const ok = window.confirm("Delete this transaction?");
    if (!ok) return;

    try {
      await deleteTransaction(id);
      await loadTransactions();
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      setError("Could not delete transaction");
    }
  };

  return (
    <div className="spendings-page">
      <header className="spendings-header">
        <div>
          <h1>Spendings</h1>
          <p className="spendings-subtitle">
            Overview of your expenses and recent transactions.
          </p>
        </div>

        <button className="period-pill">
          {periodLabel}
          <span className="period-pill-caret">▾</span>
        </button>
      </header>

      {loading && <p className="spendings-status">Loading spendings…</p>}
      {error && <p className="spendings-status error">{error}</p>}

      {!loading && !error && (
        <div className="spendings-grid">
          {/* Top row summary cards */}
          <section className="card summary-card">
            <div className="summary-header">
              <span className="summary-label">All expenses</span>
              <span className="summary-period">{periodLabel}</span>
            </div>
            <div className="summary-main-amount">
              € {totals.total.toFixed(2)}
            </div>
            <div className="summary-breakdown">
              <div>
                <span className="summary-breakdown-label">Daily</span>
                <span className="summary-breakdown-value">
                  € {totals.daily.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="summary-breakdown-label">Weekly</span>
                <span className="summary-breakdown-value">
                  € {totals.weekly.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="summary-breakdown-label">Monthly</span>
                <span className="summary-breakdown-value">
                  € {totals.monthly.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          <section className="card helper-card">
            <h2>Standing orders</h2>
            <p>
              Set up recurring payments for rent, subscriptions or savings so
              you never miss a payment.
            </p>
            <button className="primary-outline-btn">
              Define standing order
            </button>
          </section>

          {/* Bottom row: latest transactions + category breakdown */}
          <section className="card latest-txs-card">
            <div className="card-header-row">
              <h2>Latest transactions</h2>
            </div>

            {latestTransactions.length === 0 ? (
              <p className="empty-state">No transactions yet.</p>
            ) : (
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="tx-amount-col">Amount</th>
                    <th className="tx-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {latestTransactions.map((tx) => (
                    <tr key={tx._id || tx.id}>
                      <td>{tx.date ? tx.date.slice(0, 10) : "—"}</td>
                      <td>{tx.description || "—"}</td>
                      <td>
                        <span className="tx-category-pill">
                          {tx.category || "Other"}
                        </span>
                      </td>
                      <td className="tx-amount-col">
                        <span className="tx-amount">
                          € {(Number(tx.amount) || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="tx-actions-col">
                        <button
                          type="button"
                          className="tx-action-btn"
                          onClick={() => startEdit(tx)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="tx-action-btn danger"
                          onClick={() => handleDelete(tx)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button className="link-button">See more →</button>
          </section>

          <section className="card category-card">
            <div className="card-header-row">
              <h2>Expenses by category</h2>
            </div>

            {categoryList.length === 0 ? (
              <p className="empty-state">No category data yet.</p>
            ) : (
              <div className="category-list">
                {categoryList.map((cat) => (
                  <div key={cat.name} className="category-row">
                    <div className="category-row-top">
                      <span className="category-name">{cat.name}</span>
                      <span className="category-value">
                        € {cat.value.toFixed(2)}
                      </span>
                    </div>
                    <div className="category-bar-bg">
                      <div
                        className="category-bar-fill"
                        style={{ width: `${cat.barWidth}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ---------- EDIT MODAL ---------- */}
      {editingTx && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Edit transaction</h3>
            {editError && (
              <p className="spendings-status error" style={{ marginTop: "0.4rem" }}>
                {editError}
              </p>
            )}

            <form className="tx-form" onSubmit={handleEditSubmit}>
              <div className="tx-field">
                <label>
                  <span>Amount (€)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTx.amount}
                    onChange={(e) =>
                      handleEditFieldChange("amount", e.target.value)
                    }
                    required
                  />
                </label>
              </div>

              <div className="tx-field">
                <label>
                  <span>Type</span>
                  <select
                    value={editingTx.type}
                    onChange={(e) =>
                      handleEditFieldChange("type", e.target.value)
                    }
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>
              </div>

              <div className="tx-field">
                <label>
                  <span>Category</span>
                  <select
                    value={editingTx.category}
                    onChange={(e) =>
                      handleEditFieldChange("category", e.target.value)
                    }
                  >
                    {categoriesOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="tx-field">
                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={editingTx.date}
                    onChange={(e) =>
                      handleEditFieldChange("date", e.target.value)
                    }
                  />
                </label>
              </div>

              <div className="tx-field">
                <label>
                  <span>Description</span>
                  <textarea
                    rows="2"
                    value={editingTx.description}
                    onChange={(e) =>
                      handleEditFieldChange("description", e.target.value)
                    }
                    placeholder="Optional note"
                  />
                </label>
              </div>

              <div className="tx-actions">
                <button
                  type="button"
                  className="tx-cancel-btn"
                  onClick={() => setEditingTx(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tx-save-btn"
                  disabled={editSaving}
                >
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Spendings;
