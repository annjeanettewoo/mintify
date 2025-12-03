// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import logo from "../assets/mintify-logo.png";
import Spendings from "./Spendings";
import {
  fetchBudgets,
  fetchTransactions,
  createTransaction,
} from "../services/financeApi";

function Dashboard({ onLogout }) {
  // Which main view is shown: "dashboard" or "spendings"
  const [activeView, setActiveView] = useState("dashboard");

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add-transaction modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newTx, setNewTx] = useState({
    amount: "",
    type: "expense",
    category: "Food",
    description: "",
    date: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
  });

  // ---------- Data loading ----------

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [budgetsRes, transactionsRes] = await Promise.all([
        fetchBudgets(),
        fetchTransactions(),
      ]);

      setBudgets(budgetsRes);
      setTransactions(transactionsRes);
    } catch (err) {
      console.error("Failed to load finance data:", err);
      setError("Could not load data from finance-service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------- Derived values from transactions ----------

  const expenseTransactions = transactions.filter((t) => t.type === "expense");

  const totalSpent = expenseTransactions.reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );

  const totalTransactionsCount = transactions.length;

  const categories = ["Food", "Groceries", "Entertainment", "Travel", "Shopping"];

  const amountsByCategory = categories.reduce((acc, cat) => {
    const amount = expenseTransactions
      .filter((t) => t.category === cat)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    acc[cat] = amount;
    return acc;
  }, {});

  const maxCategoryAmount =
    Math.max(
      ...categories.map((cat) => amountsByCategory[cat] || 0),
      1 // avoid divide by zero
    );

  const barWidth = (cat) => {
    const amt = amountsByCategory[cat] || 0;
    return `${Math.round((amt / maxCategoryAmount) * 100)}%`;
  };

  const fmt = (num) =>
    typeof num === "number" ? num.toFixed(2) : "0.00";

  // ---------- Handlers ----------

  const handleAddTransaction = async (e) => {
    e.preventDefault();

    try {
      setSavingTx(true);
      setFormError(null);

      const payload = {
        ...newTx,
        amount: Number(newTx.amount),
      };

      await createTransaction(payload);
      await loadData();

      // reset & close
      setShowAddForm(false);
      setNewTx({
        amount: "",
        type: "expense",
        category: "Food",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error("Failed to create transaction:", err);
      setFormError("Could not save transaction. Please try again.");
    } finally {
      setSavingTx(false);
    }
  };

  return (
    <div className="app">
      <div className="app-shell">
        {/* -------- SIDEBAR -------- */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src={logo} alt="Mintify logo" />
            <span className="brand-name">mintify</span>
          </div>

          <nav className="sidebar-nav">
            <p className="sidebar-section-label">GENERAL</p>

            {/* DASHBOARD TAB */}
            <button
              type="button"
              className={`nav-item ${
                activeView === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveView("dashboard")}
            >
              <span className="nav-dot" />
              <span>Dashboard</span>
            </button>

            {/* SPENDINGS TAB (new NevBank-style page) */}
            <button
              type="button"
              className={`nav-item ${
                activeView === "spendings" ? "active" : ""
              }`}
              onClick={() => setActiveView("spendings")}
            >
              <span className="nav-dot" />
              <span>Spendings</span>
            </button>

            {/* The rest are just placeholders for now */}
            <button type="button" className="nav-item">
              <span className="nav-dot" />
              <span>Budgets</span>
            </button>
            <button type="button" className="nav-item">
              <span className="nav-dot" />
              <span>Calendar</span>
            </button>

            <p className="sidebar-section-label">TOOLS</p>
            <button type="button" className="nav-item">
              <span className="nav-dot" />
              <span>Reports</span>
            </button>
            <button type="button" className="nav-item">
              <span className="nav-dot" />
              <span>Settings</span>
            </button>
          </nav>

          <button className="logout-btn" onClick={onLogout}>
            Log out
          </button>
        </aside>

        {/* -------- MAIN CONTENT -------- */}
        <div className="content">
          {/* TOPBAR */}
          <header className="topbar">
            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search transactions, budgets..."
              />
            </div>

            <div className="topbar-right">
              <button className="pill-btn">This month</button>
              <button className="round-btn">👤</button>
            </div>
          </header>

          {/* MAIN AREA */}
          <main className="main">
            {/* ----- VIEW: DASHBOARD (your original layout) ----- */}
            {activeView === "dashboard" && (
              <>
                {loading && (
                  <p className="muted" style={{ marginBottom: "1rem" }}>
                    Loading data from finance-service…
                  </p>
                )}
                {error && (
                  <p
                    className="muted"
                    style={{
                      color: "var(--deep-cherry)",
                      marginBottom: "1rem",
                    }}
                  >
                    {error}
                  </p>
                )}

                <section className="left-panel">
                  <header className="panel-header">
                    <h1>Your spendings &amp; budgets</h1>
                    <p className="muted">
                      Overview of your spending breakdown and budget status for
                      this month.
                    </p>
                  </header>

                  {/* SUMMARY: TOTAL + BAR GRAPH */}
                  <div className="summary-row">
                    {/* Total spent / Add transaction */}
                    <div className="donut-card">
                      <p className="muted-small">Total spent this month</p>
                      <h2 className="big-amount">€ {fmt(totalSpent)}</h2>
                      <p className="muted-small">
                        Across {totalTransactionsCount} transactions
                      </p>

                      <button
                        className="add-transaction-btn"
                        onClick={() => setShowAddForm(true)}
                      >
                        + Add transaction
                      </button>

                      <div className="legend-row">
                        <span className="legend-dot orange" />
                        <span className="legend-label">Food</span>

                        <span className="legend-dot yellow" />
                        <span className="legend-label">Groceries</span>

                        <span className="legend-dot blue" />
                        <span className="legend-label">Entertainment</span>

                        <span className="legend-dot green" />
                        <span className="legend-label">Travel</span>

                        <span className="legend-dot purple" />
                        <span className="legend-label">Shopping</span>
                      </div>
                    </div>

                    {/* Bar chart */}
                    <div className="bar-card">
                      <p className="muted-small">Spending by category</p>
                      <h3 className="bar-title">This month&apos;s breakdown</h3>

                      <div className="bar-list">
                        <div className="bar-row">
                          <div className="bar-label">Food</div>
                          <div className="bar-track">
                            <div
                              className="bar-fill food"
                              style={{ width: barWidth("Food") }}
                            />
                          </div>
                          <div className="bar-amount">
                            € {fmt(amountsByCategory["Food"] || 0)}
                          </div>
                        </div>

                        <div className="bar-row">
                          <div className="bar-label">Groceries</div>
                          <div className="bar-track">
                            <div
                              className="bar-fill groceries"
                              style={{ width: barWidth("Groceries") }}
                            />
                          </div>
                          <div className="bar-amount">
                            € {fmt(amountsByCategory["Groceries"] || 0)}
                          </div>
                        </div>

                        <div className="bar-row">
                          <div className="bar-label">Entertainment</div>
                          <div className="bar-track">
                            <div
                              className="bar-fill entertainment"
                              style={{ width: barWidth("Entertainment") }}
                            />
                          </div>
                          <div className="bar-amount">
                            € {fmt(
                              amountsByCategory["Entertainment"] || 0
                            )}
                          </div>
                        </div>

                        <div className="bar-row">
                          <div className="bar-label">Travel</div>
                          <div className="bar-track">
                            <div
                              className="bar-fill travel"
                              style={{ width: barWidth("Travel") }}
                            />
                          </div>
                          <div className="bar-amount">
                            € {fmt(amountsByCategory["Travel"] || 0)}
                          </div>
                        </div>

                        <div className="bar-row">
                          <div className="bar-label">Shopping</div>
                          <div className="bar-track">
                            <div
                              className="bar-fill shopping"
                              style={{
                                width: barWidth("Shopping"),
                              }}
                            />
                          </div>
                          <div className="bar-amount">
                            € {fmt(amountsByCategory["Shopping"] || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CATEGORY CARDS – ROUNDED RECTANGLES */}
                  <div className="spending-cards">
                    <div className="spending-card category-card--food">
                      <p className="card-label">Food</p>
                      <h3>€ {fmt(amountsByCategory["Food"] || 0)}</h3>
                      <p className="muted-small">Dining out, coffee, snacks</p>
                    </div>

                    <div className="spending-card category-card--groceries">
                      <p className="card-label">Groceries</p>
                      <h3>€ {fmt(amountsByCategory["Groceries"] || 0)}</h3>
                      <p className="muted-small">
                        Supermarket &amp; essentials
                      </p>
                    </div>

                    <div className="spending-card category-card--entertainment">
                      <p className="card-label">Entertainment</p>
                      <h3>
                        € {fmt(amountsByCategory["Entertainment"] || 0)}
                      </h3>
                      <p className="muted-small">
                        Movies, subscriptions, events
                      </p>
                    </div>

                    <div className="spending-card category-card--travel">
                      <p className="card-label">Travel</p>
                      <h3>€ {fmt(amountsByCategory["Travel"] || 0)}</h3>
                      <p className="muted-small">
                        Flights, trains, transport
                      </p>
                    </div>

                    <div className="spending-card category-card--shopping">
                      <p className="card-label">Shopping</p>
                      <h3>€ {fmt(amountsByCategory["Shopping"] || 0)}</h3>
                      <p className="muted-small">Clothes, gadgets, extras</p>
                    </div>
                  </div>
                </section>

                {/* ADD TRANSACTION MODAL */}
                {showAddForm && (
                  <div className="modal-backdrop">
                    <div className="modal-card">
                      <h3>Add transaction</h3>
                      {formError && (
                        <p
                          className="muted"
                          style={{
                            color: "var(--deep-cherry)",
                            marginTop: "0.4rem",
                          }}
                        >
                          {formError}
                        </p>
                      )}

                      <form className="tx-form" onSubmit={handleAddTransaction}>
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
                            onClick={() => setShowAddForm(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="tx-save-btn"
                            disabled={savingTx}
                          >
                            {savingTx ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ----- VIEW: SPENDINGS PAGE (NevBank-style) ----- */}
            {activeView === "spendings" && <Spendings />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
