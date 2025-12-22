// src/pages/Budgets.jsx
import { useState } from "react";
import "./Budgets.css";

function Budgets({
  budgets = [],
  transactions = [],
  loading,
  error,
  onCreateBudget,
}) {
  // ---------- BASIC NUMBERS FROM TRANSACTIONS ----------
  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = incomeTotal - expenseTotal;
  const savingsBudget = Math.max(balance, 0); // simple proxy

  // ---------- CATEGORY SUMMARY ----------
  const expenseByCategoryMap = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const cat = t.category || "Other";
      const amount = Number(t.amount) || 0;
      acc[cat] = (acc[cat] || 0) + amount;
      return acc;
    }, {});

  const categorySummary = Object.entries(expenseByCategoryMap).map(
    ([category, spent]) => {
      const budgetObj = budgets.find(
        (b) => (b.category || "Other") === category
      );
      const budget = budgetObj ? budgetObj.limit || budgetObj.amount || 0 : 0;
      return { category, spent, budget };
    }
  );

  // add any budget categories that have 0 expenses
  budgets.forEach((b) => {
    const cat = b.category || "Other";
    if (!categorySummary.find((c) => c.category === cat)) {
      categorySummary.push({
        category: cat,
        spent: 0,
        budget: b.limit || b.amount || 0,
      });
    }
  });

  const expensesByCategory = categorySummary;

  const topExpenses = [...categorySummary]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  // ---------- CASH-FLOW BAR WIDTHS ----------
  const maxFlow = Math.max(incomeTotal, expenseTotal, savingsBudget || 0, 1);
  const widthPct = (value) =>
    `${Math.round(((value || 0) / maxFlow) * 100)}%`;

  // ---------- DONUT DATA: EXPENSES BY CATEGORY ----------
  const donutColours = [
    "#F7D766", // yellow
    "#F29E9E", // soft red
    "#A9C7E2", // blue
    "#B5E2B0", // green
    "#D9B4F2", // lilac
    "#FFCBA4", // peach
  ];

  const totalSpentAcrossCategories = categorySummary.reduce(
    (sum, row) => sum + (row.spent || 0),
    0
  );

  let runningAngle = 0;
  const donutSlices =
    totalSpentAcrossCategories > 0
      ? categorySummary.map((row, index) => {
          const value = row.spent || 0;
          const share = value / totalSpentAcrossCategories;
          const startAngle = runningAngle;
          const sliceAngle = share * 360;
          const endAngle = startAngle + sliceAngle;
          runningAngle = endAngle;

          return {
            category: row.category,
            value,
            colour: donutColours[index % donutColours.length],
            startAngle,
            endAngle,
          };
        })
      : [];

  const donutStyle =
    donutSlices.length > 0
      ? {
          backgroundImage: `conic-gradient(${donutSlices
            .map(
              (s) =>
                `${s.colour} ${s.startAngle}deg ${s.endAngle}deg`
            )
            .join(", ")})`,
        }
      : {
          backgroundImage:
            "radial-gradient(circle at center, #fffdf8 60%, #f0e1c0 61%)",
        };

  // ---------- CREATE BUDGET MODAL STATE ----------
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    category: "",
    limit: "",
  });
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState(null);

  const openBudgetModal = () => {
    setBudgetError(null);
    setBudgetForm({ category: "", limit: "" });
    setShowBudgetModal(true);
  };

  const closeBudgetModal = () => {
    if (savingBudget) return;
    setShowBudgetModal(false);
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!onCreateBudget) {
      setBudgetError("Budget creation is not available.");
      return;
    }
    const category = budgetForm.category.trim();
    const limit = Number(budgetForm.limit);

    if (!category || !limit || limit <= 0) {
      setBudgetError("Please enter a category and a positive amount.");
      return;
    }

    try {
      setSavingBudget(true);
      setBudgetError(null);
      await onCreateBudget({ category, limit });
      setShowBudgetModal(false);
      setBudgetForm({ category: "", limit: "" });
    } catch (err) {
      console.error("Create budget failed:", err);
      setBudgetError("Could not create budget. Please try again.");
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <div className="budgets-view">
      <header className="budgets-header-row">
        <div>
          <p className="period-label">Period</p>
          <h1 className="budgets-title">
            Personal Finance Budget Dashboard
          </h1>
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

        {/* CTA summary card */}
        <div className="summary-card summary-card-cta">
          <p className="summary-label">Budgets</p>
          <button
            type="button"
            className="create-budget-btn"
            onClick={openBudgetModal}
          >
            + Create budget
          </button>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="budgets-main-grid">
        {/* Cash flow summary (bars) */}
        <div className="panel panel-tall">
          <h3 className="panel-title">Cash flow summary</h3>
          <p className="panel-subtitle">Actual vs budget</p>

          <div className="cf-row">
            <span className="cf-label">Income</span>
            <div className="cf-bar-track">
              <div
                className="cf-bar income"
                style={{ width: widthPct(incomeTotal) }}
              />
            </div>
            <span className="cf-value">€{incomeTotal.toFixed(0)}</span>
          </div>

          <div className="cf-row">
            <span className="cf-label">Expenses</span>
            <div className="cf-bar-track">
              <div
                className="cf-bar expense"
                style={{ width: widthPct(expenseTotal) }}
              />
            </div>
            <span className="cf-value">€{expenseTotal.toFixed(0)}</span>
          </div>

          <div className="cf-row">
            <span className="cf-label">Savings budget</span>
            <div className="cf-bar-track">
              <div
                className="cf-bar savings"
                style={{ width: widthPct(savingsBudget) }}
              />
            </div>
            <span className="cf-value">
              {savingsBudget ? `€${savingsBudget.toFixed(0)}` : "—"}
            </span>
          </div>
        </div>

        {/* Allocation donut – expenses by category */}
        <div className="panel">
          <h3 className="panel-title">Allocation summary</h3>
          <p className="panel-subtitle">Expenses by category</p>

          <div className="donut-wrapper">
            <div className="donut" style={donutStyle}>
              <div className="donut-hole" />
            </div>

            <div className="donut-legend">
              {donutSlices.length > 0 ? (
                donutSlices.map((slice) => (
                  <div
                    className="legend-item"
                    key={slice.category}
                  >
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: slice.colour }}
                    />
                    <span>
                      {slice.category} – €
                      {slice.value.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted-row">No expense data yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Highest expenses */}
        <div className="panel">
          <h3 className="panel-title">Highest expenses</h3>
          <ul className="highest-list">
            {topExpenses.length > 0 ? (
              topExpenses.map((e) => (
                <li key={e.category}>
                  <span>{e.category}</span>
                  <span className="highest-amount">
                    €{e.spent.toFixed(2)}
                  </span>
                </li>
              ))
            ) : (
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
              {expensesByCategory.length > 0 ? (
                expensesByCategory.map((row) => {
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
                })
              ) : (
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

      {/* ---------- CREATE BUDGET MODAL ---------- */}
      {showBudgetModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Create budget</h3>
            {budgetError && (
              <p
                className="muted"
                style={{
                  color: "var(--deep-cherry)",
                  marginTop: "0.4rem",
                }}
              >
                {budgetError}
              </p>
            )}

            <form className="tx-form" onSubmit={handleBudgetSubmit}>
              <div className="tx-field">
                <label>
                  <span>Category</span>
                  <input
                    type="text"
                    value={budgetForm.category}
                    onChange={(e) =>
                      setBudgetForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder="e.g. Groceries"
                    required
                  />
                </label>
              </div>

              <div className="tx-field">
                <label>
                  <span>Monthly limit (€)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetForm.limit}
                    onChange={(e) =>
                      setBudgetForm((prev) => ({
                        ...prev,
                        limit: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="tx-actions">
                <button
                  type="button"
                  className="tx-cancel-btn"
                  onClick={closeBudgetModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tx-save-btn"
                  disabled={savingBudget}
                >
                  {savingBudget ? "Saving..." : "Save budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;
