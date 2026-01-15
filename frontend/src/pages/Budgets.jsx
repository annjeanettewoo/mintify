// src/pages/Budgets.jsx
import { useState, useMemo, useEffect } from "react";
import { 
  fetchBudgets, 
  fetchTransactions, 
  createBudget, 
  updateBudget, 
  deleteBudget 
} from "../services/financeApi";
import "./Budgets.css";

const CATEGORY_COLORS = {
  "Food": "#D9534F",
  "Groceries": "#F7D766",
  "Entertainment": "#8ab6ff",
  "Travel": "#c7e8b3",
  "Shopping": "#e8d5ff",
  "Other": "#f9965c"
};

const ALLOWED_CATEGORIES = Object.keys(CATEGORY_COLORS);

function Budgets() {
  // --- STATE ---
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7)
  );
  
  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | null
  const [editingItem, setEditingItem] = useState(null);
  
  const [form, setForm] = useState({ 
    category: "", 
    limit: "", 
    spent: "", 
    period: "" 
  });
  
  const [isSaving, setIsSaving] = useState(false);

  // --- DATA LOADING ---
  const loadData = async () => {
    if (budgets.length === 0) setLoading(true);
    try {
      const [bData, tData] = await Promise.all([
        fetchBudgets(),
        fetchTransactions()
      ]);
      setBudgets(bData);
      setTransactions(tData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load budget data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRemoteUpdate = () => {
      console.log("Remote update received, refreshing budgets...");
      loadData();
    };
    window.addEventListener("mintify:data-updated", handleRemoteUpdate);

    const bc = new BroadcastChannel('mintify_sync');
    bc.onmessage = (event) => {
      if (event.data === 'refresh') loadData();
    };

    return () => {
      window.removeEventListener("mintify:data-updated", handleRemoteUpdate);
      bc.close();
    };
  }, []);

  // --- HELPERS ---
  const broadcastUpdate = () => {
    const bc = new BroadcastChannel('mintify_sync');
    bc.postMessage('refresh');
    bc.close();
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // COLOR LOGIC
  const getPercentageColor = (percent) => {
    if (percent > 100) return "text-danger";  // > 100% (Red)
    if (percent >= 90) return "text-orange";  // 90% - 100% (Orange)
    if (percent >= 75) return "text-yellow";  // 75% - 89% (Yellow)
    return "text-success";                    // < 75% (Green)
  };

  // --- DATA PROCESSING ---
  const currentBudgets = useMemo(() => {
    return budgets.filter((b) => b.period === selectedPeriod);
  }, [budgets, selectedPeriod]);

  const currentTransactions = useMemo(() => {
    return transactions.filter((t) => t.date && t.date.startsWith(selectedPeriod));
  }, [transactions, selectedPeriod]);

  const availableCategories = useMemo(() => {
    const usedCategories = currentBudgets.map(b => b.category);
    const editingCategory = modalType === 'edit' ? editingItem?.category : null;
    
    return ALLOWED_CATEGORIES.filter(cat => 
      !usedCategories.includes(cat) || cat === editingCategory
    );
  }, [currentBudgets, modalType, editingItem]);

  const budgetData = useMemo(() => {
    const actualsMap = currentTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const cat = t.category || "Other";
        acc[cat] = (acc[cat] || 0) + Number(t.amount);
        return acc;
      }, {});

    return currentBudgets.map((b) => {
      const transactionSpent = actualsMap[b.category] || 0;
      const totalSpent = (b.spent || 0) + transactionSpent; 
      const color = CATEGORY_COLORS[b.category] || CATEGORY_COLORS["Other"];

      return {
        ...b,
        calculatedSpent: totalSpent,
        remaining: b.limit - totalSpent,
        percent: b.limit > 0 ? (totalSpent / b.limit) * 100 : 0,
        color: color 
      };
    });
  }, [currentBudgets, currentTransactions]);

  const totalLimit = budgetData.reduce((sum, b) => sum + (b.limit || 0), 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + (b.calculatedSpent || 0), 0);
  const totalPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  // --- PIE CHART ---
  const pieChartGradient = useMemo(() => {
    if (totalLimit === 0) return "conic-gradient(#f0e1c0 0% 100%)";
    let currentDeg = 0;
    const segments = budgetData.map((b) => {
      const share = b.limit / totalLimit;
      const deg = share * 360;
      const segment = `${b.color} ${currentDeg}deg ${currentDeg + deg}deg`;
      currentDeg += deg;
      return segment;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [budgetData, totalLimit]);

  // --- HANDLERS ---
  const handleMonthChange = (e) => setSelectedPeriod(e.target.value);

  const openCreateModal = () => {
    const used = currentBudgets.map(b => b.category);
    const available = ALLOWED_CATEGORIES.filter(c => !used.includes(c));
    
    if (available.length === 0) {
      alert("All categories have budgets for this month. Edit an existing one instead.");
      return;
    }

    setForm({ 
      category: available[0],
      limit: "", 
      spent: "0", 
      period: selectedPeriod 
    });
    setModalType("create");
  };

  const openEditModal = (budget) => {
    setEditingItem(budget);
    setForm({ 
      category: budget.category, 
      limit: budget.limit, 
      spent: budget.spent || 0, 
      period: budget.period 
    });
    setModalType("edit");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this budget?")) {
      try {
        await deleteBudget(id);
        setBudgets((prev) => prev.filter((b) => b._id !== id));
        showSuccess("🗑 Budget deleted");
        broadcastUpdate();
      } catch (err) {
        alert("Failed to delete budget");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        category: form.category,
        limit: Number(form.limit),
        spent: Number(form.spent),
        period: selectedPeriod,
      };

      if (modalType === "create") {
        const newBudget = await createBudget(payload);
        setBudgets((prev) => [...prev, newBudget]);
        showSuccess("✅ Budget created successfully");
      } else if (modalType === "edit" && editingItem) {
        const updated = await updateBudget(editingItem._id, payload);
        setBudgets((prev) => prev.map(b => b._id === updated._id ? updated : b));
        showSuccess("📝 Budget updated");
      }
      broadcastUpdate();
      setModalType(null);
    } catch (err) {
      console.error(err);
      alert("Error saving budget.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && budgets.length === 0) return <div className="budgets-view"><p>Loading budgets...</p></div>;
  if (error) return <div className="budgets-view"><p className="error">{error}</p></div>;

  return (
    <div className="budgets-view">
      <header className="budgets-header-row">
        <h1 className="budgets-title">Budgets</h1>
        <div className="period-selector">
          <span className="period-label">Period:</span>
          <input 
            type="month" 
            value={selectedPeriod} 
            onChange={handleMonthChange} 
            className="month-picker"
          />
        </div>
      </header>

      {successMsg && (
        <div className="success-banner">
          {successMsg}
        </div>
      )}

      <div className="budgets-grid">
        {/* TOTAL SUMMARY */}
        <section className="dashboard-card summary-card">
          <h3 className="card-title">Total Overview</h3>
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">Total Budget</span>
              <span className="summary-value big">€{totalLimit.toLocaleString()}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item">
              <span className="summary-label">Total Spent</span>
              <span className={`summary-value ${totalSpent > totalLimit ? "negative" : ""}`}>
                €{totalSpent.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="total-progress-bar">
             <div className="total-progress-fill" style={{width: `${Math.min(totalPercent, 100)}%`}}></div>
          </div>
          <p className={`summary-footer ${getPercentageColor(totalPercent)}`}>
            <strong>{Math.round(totalPercent)}%</strong> of budget used
          </p>
        </section>

        {/* PIE CHART */}
        <section className="dashboard-card pie-card">
          <h3 className="card-title">Budget Distribution</h3>
          <div className="pie-layout">
            <div className="pie-chart" style={{ background: pieChartGradient }}>
              <div className="pie-hole"></div>
            </div>
            <div className="pie-legend">
              {budgetData.length === 0 ? <span className="text-muted">No budgets yet</span> : 
               budgetData.map(b => (
                <div key={b._id} className="legend-item">
                  <span className="legend-dot" style={{background: b.color}}></span>
                  <span className="legend-text">{b.category}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACTIONS */}
        <section className="dashboard-card actions-card">
          <h3 className="card-title">Actions</h3>
          <p className="actions-desc">Manage your spending limits for this month.</p>
          <button 
            className="create-budget-btn big-btn" 
            onClick={openCreateModal}
            disabled={availableCategories.length === 0}
            title={availableCategories.length === 0 ? "All categories used" : "Create new budget"}
          >
            + Create New Budget
          </button>
        </section>

        {/* BREAKDOWN TABLE */}
        <section className="dashboard-card breakdown-card">
          <h3 className="card-title">Monthly Breakdown</h3>
          {budgetData.length === 0 ? (
            <div className="empty-state">No budgets set for {selectedPeriod}.</div>
          ) : (
            <div className="table-wrapper">
              <table className="budget-table compact">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="hide-mobile">Progress</th>
                    <th>Spent / Limit</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {budgetData.map((b) => (
                    <tr key={b._id}>
                      <td><span className="cat-dot" style={{background:b.color}}></span> {b.category}</td>
                      <td className="hide-mobile">
                        <div className="table-progress">
                          <div className="table-progress-fill" style={{width: `${Math.min(b.percent, 100)}%`, background: b.color}}></div>
                        </div>
                      </td>
                      <td>€{b.calculatedSpent.toLocaleString()} <span className="text-muted">/ {b.limit.toLocaleString()}</span></td>
                      {/* Status logic: red if negative */}
                      <td className={b.remaining < 0 ? "negative" : "positive"}>
                        {b.remaining < 0 ? "-" : "+"}€{Math.abs(b.remaining).toLocaleString()}
                      </td>
                      <td className="action-cell">
                        <button className="icon-btn" onClick={() => openEditModal(b)}>✎</button>
                        <button className="icon-btn delete" onClick={() => handleDelete(b._id)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalType && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>{modalType === "create" ? "Create Budget" : "Edit Budget"}</h3>
            <form onSubmit={handleSubmit} className="tx-form">
              <div className="tx-row">
                <label>Category</label>
                <div className="input-wrapper">
                  <select 
                    value={form.category} 
                    onChange={(e) => setForm({ ...form, category: e.target.value })} 
                    required 
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="tx-row">
                <label>Limit Amount (€)</label>
                <div className="input-wrapper">
                  <input 
                    type="number" 
                    value={form.limit} 
                    onChange={(e) => setForm({ ...form, limit: e.target.value })} 
                    required 
                    min="0"
                  />
                </div>
              </div>
              <div className="tx-row">
                <label>Pre-existing Spend (€)</label>
                <div className="input-wrapper">
                  <input 
                    type="number" 
                    value={form.spent} 
                    onChange={(e) => setForm({ ...form, spent: e.target.value })} 
                    min="0"
                  />
                  <small className="field-hint">
                    Start with 0. Only change this if you spent money <em>before</em> using this app.
                  </small>
                </div>
              </div>
              <div className="tx-actions">
                <button type="button" className="cancel-btn" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Budget"}
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