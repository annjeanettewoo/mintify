import { useMemo, useState } from "react";
import { updateTransaction, deleteTransaction } from "../services/financeApi";
import "./Spendings.css";

function Spendings({ transactions = [], loading = false, error = null, onTransactionUpdate, onTransactionDelete }) {
  
  // Removed unused periodLabel state

  const [editingTx, setEditingTx] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  
  const [successMsg, setSuccessMsg] = useState(null);

  const categoriesOptions = ["Food", "Groceries", "Entertainment", "Travel", "Shopping", "Other"];
  
  const CATEGORY_COLORS = {
    "Food": "#D9534F",
    "Groceries": "#F7D766",
    "Entertainment": "#8ab6ff",
    "Travel": "#c7e8b3",
    "Shopping": "#e8d5ff",
    "Other": "#f9965c"
  };

  const totals = useMemo(() => {
    if (!transactions.length) return { total: 0, daily: 0, weekly: 0, monthly: 0, byCategory: {} };

    const byCategory = {};
    let total = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      total += amount;
      const cat = tx.category || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    });

    return { total, daily: total / 30, weekly: total / 4, monthly: total, byCategory };
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA; 
    });
  }, [transactions]);

  const latestTransactions = useMemo(() => sortedTransactions.slice(0, 10), [sortedTransactions]);

  const categoryList = useMemo(() => {
    const entries = Object.entries(totals.byCategory);
    if (!entries.length) return [];
    
    entries.sort((a, b) => b[1] - a[1]);

    const max = Math.max(...entries.map(([_, v]) => v || 0)) || 1;
    
    return entries.map(([name, value]) => ({ 
      name, 
      value, 
      barWidth: (value / max) * 100,
      color: CATEGORY_COLORS[name] || "#CCCCCC" 
    }));
  }, [totals.byCategory]);

  const broadcastUpdate = () => {
    const bc = new BroadcastChannel('mintify_sync');
    bc.postMessage('refresh');
    bc.close();
  };

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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const id = editingTx._id || editingTx.id;
    if (!id) return;

    try {
      setEditSaving(true);
      const payload = { ...editingTx, amount: Number(editingTx.amount) };

      await updateTransaction(id, payload);

      if (onTransactionUpdate) {
        onTransactionUpdate(payload);
      }

      setEditingTx(null);
      setSuccessMsg("📝 Transaction was edited");
      setTimeout(() => setSuccessMsg(null), 3000);
      
      broadcastUpdate(); 

    } catch (err) {
      setEditError("Could not update transaction.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (tx) => {
    const id = tx._id || tx.id;
    if (!id || !window.confirm("Delete this transaction?")) return;

    try {
      await deleteTransaction(id);
      
      if (onTransactionDelete) {
        onTransactionDelete(id);
      }

      setSuccessMsg("🗑 Transaction deleted");
      setTimeout(() => setSuccessMsg(null), 3000);
      
      broadcastUpdate(); 

    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete transaction");
    }
  };

  return (
    <div className="spendings-page">
      <header className="spendings-header">
        <div>
          <h1>Spendings</h1>
          <p className="spendings-subtitle">Overview of your expenses and recent transactions.</p>
        </div>
        {/* 'This month' button removed completely */}
      </header>
      
      {successMsg && (
        <div style={{ backgroundColor: "#d4edda", color: "#155724", padding: "10px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #c3e6cb", fontSize: "14px" }}>
          {successMsg}
        </div>
      )}

      {!loading && !error && (
        <div className="spendings-grid">
          
          <section className="card summary-card" style={{ gridColumn: "1 / -1" }}>
            <div className="summary-left-group">
              <span className="summary-label">All Expenses</span>
              <div className="summary-main-amount">€ {totals.total.toFixed(2)}</div>
            </div>
            
            <div className="summary-breakdown">
              <div><span>Daily</span> <span>€ {totals.daily.toFixed(2)}</span></div>
              <div><span>Weekly</span> <span>€ {totals.weekly.toFixed(2)}</span></div>
              <div><span>Monthly</span> <span>€ {totals.monthly.toFixed(2)}</span></div>
            </div>
          </section>

          <section className="card latest-txs-card">
            <div className="card-header-row"><h2>Latest transactions</h2></div>
            {latestTransactions.length === 0 ? <p className="empty-state">No transactions yet.</p> : (
              <div className="table-wrapper">
                <table className="tx-table compact">
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {latestTransactions.map((tx) => (
                      <tr key={tx._id || tx.id}>
                        <td>{tx.date ? tx.date.slice(0, 10) : "—"}</td>
                        <td><div className="tx-desc-truncate">{tx.description}</div></td>
                        <td><span className="tx-category-pill small">{tx.category}</span></td>
                        <td>€ {(Number(tx.amount) || 0).toFixed(2)}</td>
                        <td className="actions-cell">
                          <button className="icon-btn edit-btn" onClick={() => startEdit(tx)} title="Edit">✎</button>
                          <button className="icon-btn delete-btn" onClick={() => handleDelete(tx)} title="Delete">🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card category-card">
            <h2>Expenses by category</h2>
            {categoryList.map((cat) => (
              <div key={cat.name} className="category-row">
                <div className="category-row-top"><span>{cat.name}</span><span>€ {cat.value.toFixed(2)}</span></div>
                <div className="category-bar-bg">
                  <div className="category-bar-fill" style={{ width: `${cat.barWidth}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {editingTx && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Edit transaction</h3>
            {editError && <p className="error">{editError}</p>}
            <form className="tx-form" onSubmit={handleEditSubmit}>
               <div className="tx-field"><label>Amount (€) <input type="number" step="0.01" value={editingTx.amount} onChange={(e) => setEditingTx({...editingTx, amount: e.target.value})} /></label></div>
               <div className="tx-field"><label>Type <select value={editingTx.type} onChange={(e) => setEditingTx({...editingTx, type: e.target.value})}><option value="expense">Expense</option><option value="income">Income</option></select></label></div>
               <div className="tx-field"><label>Category <select value={editingTx.category} onChange={(e) => setEditingTx({...editingTx, category: e.target.value})}>{categoriesOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></label></div>
               <div className="tx-field"><label>Date <input type="date" value={editingTx.date} onChange={(e) => setEditingTx({...editingTx, date: e.target.value})} /></label></div>
               <div className="tx-field"><label>Description <textarea value={editingTx.description} onChange={(e) => setEditingTx({...editingTx, description: e.target.value})} /></label></div>
               <div className="tx-actions">
                 <button type="button" onClick={() => setEditingTx(null)}>Cancel</button>
                 <button type="submit" disabled={editSaving}>{editSaving ? "Saving..." : "Save changes"}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Spendings;
