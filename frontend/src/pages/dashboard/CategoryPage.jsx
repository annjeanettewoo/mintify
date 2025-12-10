// src/pages/dashboard/CategoryPage.jsx

function CategoryPage({ category, transactions, total, onBack }) {
  // local formatter just for this page
  const fmt = (num) =>
    typeof num === "number" ? num.toFixed(2) : "0.00";

  return (
    <section className="left-panel">
      <header className="panel-header">
        <button
          type="button"
          className="back-btn"
          onClick={onBack}
          style={{ marginBottom: "1rem" }}
        >
          ← Back to overview
        </button>
        <h1>{category} spendings</h1>
        <p className="muted">
          Total: € {fmt(total)} across {transactions.length}{" "}
          {transactions.length === 1 ? "transaction" : "transactions"}.
        </p>
      </header>

      {transactions.length === 0 ? (
        <p className="empty-state" style={{ marginTop: "1rem" }}>
          No transactions yet in this category.
        </p>
      ) : (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <table className="tx-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="tx-amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id || tx.id}>
                  <td>{tx.date ? tx.date.slice(0, 10) : "—"}</td>
                  <td>{tx.description || "—"}</td>
                  <td className="tx-amount-col">
                    € {(Number(tx.amount) || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default CategoryPage;
