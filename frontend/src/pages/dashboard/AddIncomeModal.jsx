// src/pages/dashboard/AddIncomeModal.jsx
function AddIncomeModal({
  open,
  incomeTx,
  setIncomeTx,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Add income</h3>

        {error && (
          <p
            className="muted"
            style={{ color: "var(--deep-cherry)", marginTop: "0.4rem" }}
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
                value={incomeTx.amount}
                onChange={(e) =>
                  setIncomeTx((prev) => ({
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
              <span>Date</span>
              <input
                type="date"
                value={incomeTx.date}
                onChange={(e) =>
                  setIncomeTx((prev) => ({
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
                value={incomeTx.description}
                onChange={(e) =>
                  setIncomeTx((prev) => ({
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
            <button
              type="submit"
              className="tx-save-btn income-save-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save income"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddIncomeModal;
