// src/pages/Budgets.jsx
import "./Budgets.css";

function Budgets({ budgets = [], transactions = [], loading, error }) {
  // ---- Basic numbers from transactions ----
  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = incomeTotal - expenseTotal;

  const billsBudget = budgets
    .filter((b) =>
      (b.category || "").toLowerCase().includes("bill")
    )
    .reduce((sum, b) => sum + (b.limit || b.amount || 0), 0);

  const savingsBudget = budgets
    .filter((b) =>
      (b.category || "").toLowerCase().includes("saving")
    )
    .reduce((sum, b) => sum + (b.limit || b.amount || 0), 0);

  const totalBudget = budgets.reduce(
    (sum, b) => sum + (b.limit || b.amount || 0),
    0
  );

  const expensesByCategory = budgets.map((b) => {
    const catName = b.category || "Other";
    const spent = transactions
      .filter(
        (t) =>
          t.type === "expense" && (t.category || "Other") === catName
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      category: catName,
      budget: b.limit || b.amount || 0,
      spent,
    };
  });

  const topExpenses = [...expensesByCategory]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  return (
    <div className="budgets-view">
      <header className="budgets-header-row">
        <div>
          <p className="period-label">Period</p>
          <h1 className="budgets-title">Personal Finance Budget Dashboard</h1>
          <p className="budgets-subtitle">
            Overview of your current balance, income, expenses and budgets.
          </p>
        </div>
        <div className="period-pill">January ▾</div>
      </header>

      {loading && (
        <p className="budgets-status">Loading budgets &amp; transactions…</p>
      )}
      {error && (
        <p className="budgets-status error">
          Could not load data from finance-service.
        </p>
      )}

      {/* SUMMARY CARDS ROW */}
      <section className="budgets-summary-row">
        <div className="summary-card negative">
          <p className="summary-label">Current balance</p>
          <h2 className="summary-value">
            {balance >= 0 ? "+" : "-"}€{Math.abs(balance).toFixed(2)}
          </h2>
        </div>

        <div className="summary-card">
          <p className="summary-label">Income</p>
          <h2 className="summary-value">€{incomeTotal.toFixed(2)}</h2>
        </div>

        <div className="summary-card">
          <p className="summary-label">Expenses</p>
          <h2 className="summary-value">€{expenseTotal.toFixed(2)}</h2>
        </div>

        <div className="summary-card">
          <p className="summary-label">Bills budget</p>
          <h2 className="summary-value">
            {billsBudget ? `€${billsBudget.toFixed(2)}` : "—"}
          </h2>
        </div>
      </section>

      {/* MAIN GRID (like the Excel dashboard layout) */}
      <section className="budgets-main-grid">
        {/* Cash flow summary (bar-style) */}
        <div className="panel panel-tall">
          <h3 className="panel-title">Cash flow summary</h3>
          <p className="panel-subtitle">Actual vs budget</p>

          <div className="cf-row">
            <span className="cf-label">Income</span>
            <div className="cf-bar-track">
              <div
                className="cf-bar income"
                style={{
                  width: totalBudget
                    ? `${Math.min(
                        100,
                        (incomeTotal / (totalBudget || 1)) * 100
                      )}%`
                    : "60%",
                }}
              />
            </div>
            <span className="cf-value">€{incomeTotal.toFixed(0)}</span>
          </div>

          <div className="cf-row">
            <span className="cf-label">Expenses</span>
            <div className="cf-bar-track">
              <div
                className="cf-bar expense"
                style={{
                  width: totalBudget
                    ? `${Math.min(
                        100,
                        (expenseTotal / (totalBudget || 1)) * 100
                      )}%`
                    : "40%",
                }}
              />
            </div>
            <span className="cf-value">€{expenseTotal.toFixed(0)}</span>
          </div>

          <div className="cf-row">
            <span className="cf-label">Savings budget</span>
            <div className="cf-bar-track">
              <div
                className="cf-bar savings"
                style={{
                  width: totalBudget
                    ? `${Math.min(
                        100,
                        (savingsBudget / (totalBudget || 1)) * 100
                      )}%`
                    : "35%",
                }}
              />
            </div>
            <span className="cf-value">
              {savingsBudget ? `€${savingsBudget.toFixed(0)}` : "—"}
            </span>
          </div>
        </div>

        {/* Allocation donut style */}
        <div className="panel">
          <h3 className="panel-title">Allocation summary</h3>
          <p className="panel-subtitle">Budget vs expenses</p>

          <div className="donut-wrapper">
            <div className="donut">
              <div className="donut-hole" />
            </div>
            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot legend-budget" />
                <span>Budget</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot legend-actual" />
                <span>Actual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Highest expenses */}
        <div className="panel">
          <h3 className="panel-title">Highest expenses</h3>
          <ul className="highest-list">
            {topExpenses.map((e) => (
              <li key={e.category}>
                <span>{e.category}</span>
                <span className="highest-amount">
                  €{e.spent.toFixed(2)}
                </span>
              </li>
            ))}
            {topExpenses.length === 0 && (
              <li className="muted-row">No expense data yet.</li>
            )}
          </ul>
        </div>

        {/* Budget vs actual mini table */}
        <div className="panel panel-wide">
          <h3 className="panel-title">Budget vs actual</h3>
          <table className="bva-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Actual</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              {expensesByCategory.map((row) => {
                const diff = (row.spent || 0) - (row.budget || 0);
                return (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>€{(row.budget || 0).toFixed(2)}</td>
                    <td>€{(row.spent || 0).toFixed(2)}</td>
                    <td className={diff > 0 ? "over" : "under"}>
                      {diff > 0 ? "+" : ""}
                      €{diff.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {expensesByCategory.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted-row">
                    No budgets defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Budgets;
