// src/pages/dashboard/AddTransactionModal.jsx

function AddTransactionModal({
  open,
  newTx,
  setNewTx,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Add transaction</h3>
        {error && (
          <p
            className="muted"
            style={{
              color: "var(--deep-cherry)",
              marginTop: "0.4rem",
            }}
          >
            {error}
          </p>
        )}

        <form className="tx-form" onSubmit={onSubmit}>
          <div className="tx-field">
            <label>
              <span>Amount (€)</span>
              <input
                type="number"
                step="0.01"
                value={newTx.amount}
                onChange={(e) =>
                  setNewTx((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          <div className="tx-field">
            <label>
              <span>Type</span>
              <select
                value={newTx.type}
                onChange={(e) =>
                  setNewTx((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
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
                value={newTx.category}
                onChange={(e) =>
                  setNewTx((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              >
                <option>Food</option>
                <option>Groceries</option>
                <option>Entertainment</option>
                <option>Travel</option>
                <option>Shopping</option>
              </select>
            </label>
          </div>

          <div className="tx-field">
            <label>
              <span>Date</span>
              <input
                type="date"
                value={newTx.date}
                onChange={(e) =>
                  setNewTx((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="tx-field">
            <label>
              <span>Description</span>
              <textarea
                rows="2"
                value={newTx.description}
                onChange={(e) =>
                  setNewTx((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional note"
              />
            </label>
          </div>

          <div className="tx-actions">
            <button
              type="button"
              className="tx-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="tx-save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;
