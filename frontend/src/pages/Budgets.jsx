// src/pages/Budgets.jsx
import { useState } from "react";
import "./Budgets.css";

// ✅ Receive data via props, NO internal fetching
function Budgets({
  budgets = [],
  transactions = [],
  loading,
  error,
  onCreateBudget,
}) {
  // --- CALCULATIONS ---
  const incomeTotal = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
  const expenseTotal = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = incomeTotal - expenseTotal;
  const savingsBudget = Math.max(balance, 0); 

  // Map expenses to categories
  const expenseByCategoryMap = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const cat = t.category || "Other";
      acc[cat] = (acc[cat] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

  // Combine with Budgets
  const categorySummary = Object.entries(expenseByCategoryMap).map(
    ([category, spent]) => {
      const budgetObj = budgets.find((b) => (b.category || "Other") === category);
      const budget = budgetObj ? (budgetObj.limit || budgetObj.amount || 0) : 0;
      return { category, spent, budget };
    }
  );

  // Add empty budgets
  budgets.forEach((b) => {
    const cat = b.category || "Other";
    if (!categorySummary.find((c) => c.category === cat)) {
      categorySummary.push({ category: cat, spent: 0, budget: b.limit || b.amount || 0 });
    }
  });

  const topExpenses = [...categorySummary].sort((a, b) => b.spent - a.spent).slice(0, 3);
  const maxFlow = Math.max(incomeTotal, expenseTotal, savingsBudget || 0, 1);
  const widthPct = (value) => `${Math.round(((value || 0) / maxFlow) * 100)}%`;

  // --- DONUT CHART COLORS ---
  const donutColours = ["#F7D766", "#F29E9E", "#A9C7E2", "#B5E2B0", "#D9B4F2", "#FFCBA4"];
  const totalSpentAcross = categorySummary.reduce((sum, row) => sum + (row.spent || 0), 0);
  let runningAngle = 0;
  const donutSlices = totalSpentAcross > 0 ? categorySummary.map((row, index) => {
      const share = row.spent / totalSpentAcross;
      const sliceAngle = share * 360;
      const endAngle = runningAngle + sliceAngle;
      const slice = { 
          category: row.category, 
          value: row.spent, 
          colour: donutColours[index % donutColours.length], 
          startAngle: runningAngle, 
          endAngle 
      };
      runningAngle = endAngle;
      return slice;
  }) : [];

  const donutStyle = donutSlices.length > 0 ? {
    backgroundImage: `conic-gradient(${donutSlices.map(s => `${s.colour} ${s.startAngle}deg ${s.endAngle}deg`).join(", ")})`
  } : { backgroundImage: "radial-gradient(circle at center, #fffdf8 60%, #f0e1c0 61%)" };

  // --- CREATE BUDGET MODAL ---
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: "", limit: "" });
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState(null);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!onCreateBudget) return;
    try {
      setSavingBudget(true);
      await onCreateBudget({ category: budgetForm.category.trim(), limit: Number(budgetForm.limit) });
      setShowBudgetModal(false);
      setBudgetForm({ category: "", limit: "" });
    } catch (err) {
      setBudgetError("Could not create budget.");
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <div className="budgets-view">
      <header className="budgets-header-row">
        <div>
          <p className="period-label">Period</p>
          <h1 className="budgets-title">Personal Finance Budget Dashboard</h1>
          <p className="budgets-subtitle">Overview of your current balance, income, expenses and budgets.</p>
        </div>
        <div className="period-pill">January ▾</div>
      </header>

      {loading && <p className="budgets-status">Loading budgets…</p>}
      {error && <p className="budgets-status error">{error}</p>}

      <section className="budgets-summary-row">
        <div className="summary-card negative"><p className="summary-label">Current balance</p><h2 className="summary-value">{balance >= 0 ? "+" : "-"}€{Math.abs(balance).toFixed(2)}</h2></div>
        <div className="summary-card"><p className="summary-label">Income</p><h2 className="summary-value">€{incomeTotal.toFixed(2)}</h2></div>
        <div className="summary-card"><p className="summary-label">Expenses</p><h2 className="summary-value">€{expenseTotal.toFixed(2)}</h2></div>
        <div className="summary-card summary-card-cta"><p className="summary-label">Budgets</p><button className="create-budget-btn" onClick={() => setShowBudgetModal(true)}>+ Create budget</button></div>
      </section>

      <section className="budgets-main-grid">
        <div className="panel panel-tall">
          <h3 className="panel-title">Cash flow summary</h3>
          <div className="cf-row"><span className="cf-label">Income</span><div className="cf-bar-track"><div className="cf-bar income" style={{ width: widthPct(incomeTotal) }} /></div><span className="cf-value">€{incomeTotal.toFixed(0)}</span></div>
          <div className="cf-row"><span className="cf-label">Expenses</span><div className="cf-bar-track"><div className="cf-bar expense" style={{ width: widthPct(expenseTotal) }} /></div><span className="cf-value">€{expenseTotal.toFixed(0)}</span></div>
          <div className="cf-row"><span className="cf-label">Savings</span><div className="cf-bar-track"><div className="cf-bar savings" style={{ width: widthPct(savingsBudget) }} /></div><span className="cf-value">€{savingsBudget.toFixed(0)}</span></div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Allocation summary</h3>
          <div className="donut-wrapper">
            <div className="donut" style={donutStyle}><div className="donut-hole" /></div>
            <div className="donut-legend">{donutSlices.map(s => <div key={s.category} className="legend-item"><span className="legend-dot" style={{backgroundColor:s.colour}}/><span>{s.category} – €{s.value.toFixed(2)}</span></div>)}</div>
          </div>
        </div>

        <div className="panel panel-wide">
            <h3 className="panel-title">Budget vs actual</h3>
            <table className="bva-table">
                <thead><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Diff</th></tr></thead>
                <tbody>{categorySummary.map(row => {
                    const diff = (row.spent||0) - (row.budget||0);
                    return <tr key={row.category}><td>{row.category}</td><td>€{(row.budget||0).toFixed(2)}</td><td>€{(row.spent||0).toFixed(2)}</td><td className={diff>0?"over":"under"}>{diff>0?"+":""}€{diff.toFixed(2)}</td></tr>
                })}</tbody>
            </table>
        </div>
      </section>

      {showBudgetModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Create budget</h3>
            {budgetError && <p className="error">{budgetError}</p>}
            <form className="tx-form" onSubmit={handleBudgetSubmit}>
              <div className="tx-field"><label>Category <input value={budgetForm.category} onChange={e=>setBudgetForm({...budgetForm, category: e.target.value})} required /></label></div>
              <div className="tx-field"><label>Limit (€) <input type="number" value={budgetForm.limit} onChange={e=>setBudgetForm({...budgetForm, limit: e.target.value})} required /></label></div>
              <div className="tx-actions"><button type="button" onClick={()=>setShowBudgetModal(false)}>Cancel</button><button type="submit" disabled={savingBudget}>Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;