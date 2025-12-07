// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import logo from "../assets/mintify-logo.png";
import Spendings from "./Spendings";
import Budgets from "./Budgets";
import Calendar from "./Calendar";

import DashboardOverview from "./dashboard/DashboardOverview";
import CategoryPage from "./dashboard/CategoryPage";
import AddTransactionModal from "./dashboard/AddTransactionModal";
import AddIncomeModal from "./dashboard/AddIncomeModal";

import {
  fetchBudgets,
  fetchTransactions,
  createTransaction,
  createBudget,
} from "../services/financeApi";

const todayISO = () => new Date().toISOString().slice(0, 10);

function Dashboard({ onLogout, userName }) {
  // "dashboard" | "spendings" | "budgets" | "calendar" | "category"
  const [activeView, setActiveView] = useState("dashboard");

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategoryView, setActiveCategoryView] = useState(null);

  // Calendar entries: { "YYYY-MM-DD": { amount: number|null, imageUrl: string|null } }
  const [calendarEntries, setCalendarEntries] = useState({});

  // Expense modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newTx, setNewTx] = useState({
    amount: "",
    type: "expense",
    category: "Food",
    description: "",
    date: todayISO(),
  });

  // Income modal state
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const [incomeError, setIncomeError] = useState(null);
  const [incomeTx, setIncomeTx] = useState({
    amount: "",
    description: "",
    date: todayISO(),
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

  // ---------- Derived values ----------
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

  const maxCategoryAmount = Math.max(
    ...categories.map((cat) => amountsByCategory[cat] || 0),
    1
  );

  const barWidth = (cat) => {
    const amt = amountsByCategory[cat] || 0;
    return `${Math.round((amt / maxCategoryAmount) * 100)}%`;
  };

  const fmt = (num) => (typeof num === "number" ? num.toFixed(2) : "0.00");

  // total from calendar entries
  const totalCalendarLogged = Object.values(calendarEntries).reduce(
    (sum, e) => (e.amount ? sum + e.amount : sum),
    0
  );

  // ---------- Category drill-down ----------
  const categoryTransactions = useMemo(() => {
    if (!activeCategoryView) return [];
    return expenseTransactions.filter(
      (t) => (t.category || "Other") === activeCategoryView
    );
  }, [activeCategoryView, expenseTransactions]);

  const totalCategorySpent = useMemo(
    () =>
      categoryTransactions.reduce(
        (sum, t) => sum + (Number(t.amount) || 0),
        0
      ),
    [categoryTransactions]
  );

  // ---------- Handlers: expenses ----------
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

      setShowAddForm(false);
      setNewTx({
        amount: "",
        type: "expense",
        category: "Food",
        description: "",
        date: todayISO(),
      });
    } catch (err) {
      console.error("Failed to create transaction:", err);
      setFormError("Could not save transaction. Please try again.");
    } finally {
      setSavingTx(false);
    }
  };

  const openExpenseModal = () => {
    setNewTx({
      amount: "",
      type: "expense",
      category: "Food",
      description: "",
      date: todayISO(),
    });
    setShowAddForm(true);
  };

  // ---------- Handlers: income ----------
  const handleAddIncome = async (e) => {
    e.preventDefault();

    try {
      setSavingIncome(true);
      setIncomeError(null);

      const payload = {
        type: "income",
        amount: Number(incomeTx.amount),
        description: incomeTx.description,
        date: incomeTx.date,
        // no category for income
      };

      await createTransaction(payload);
      await loadData();

      setShowIncomeForm(false);
      setIncomeTx({
        amount: "",
        description: "",
        date: todayISO(),
      });
    } catch (err) {
      console.error("Failed to create income.", err);
      setIncomeError("Could not save income. Please try again.");
    } finally {
      setSavingIncome(false);
    }
  };

  const openIncomeModal = () => {
    setIncomeTx({
      amount: "",
      description: "",
      date: todayISO(),
    });
    setShowIncomeForm(true);
  };

  // ---------- Budgets ----------
  const handleCreateBudget = async ({ category, limit }) => {
    try {
      await createBudget({ category, limit });
      await loadData();
    } catch (err) {
      console.error("Failed to create budget:", err);
      throw err;
    }
  };

  // ---------- Navigation ----------
  const openCategoryPage = (category) => {
    setActiveCategoryView(category);
    setActiveView("category");
  };

  const closeCategoryPage = () => {
    setActiveCategoryView(null);
    setActiveView("dashboard");
  };

  // ---------- Render ----------
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

            <button
              type="button"
              className={`nav-item ${
                activeView === "dashboard" || activeView === "category"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setActiveView("dashboard");
                setActiveCategoryView(null);
              }}
            >
              <span className="nav-dot" />
              <span>Dashboard</span>
            </button>

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

            <button
              type="button"
              className={`nav-item ${
                activeView === "budgets" ? "active" : ""
              }`}
              onClick={() => setActiveView("budgets")}
            >
              <span className="nav-dot" />
              <span>Budgets</span>
            </button>

            <button
              type="button"
              className={`nav-item ${
                activeView === "calendar" ? "active" : ""
              }`}
              onClick={() => setActiveView("calendar")}
            >
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
              <div className="name-tag-widget">
                <div className="name-tag-top">HELLO, I AM</div>
                <div className="name-tag-box">
                  {(userName || "Guest").toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* MAIN AREA */}
          <main className="main">
            {activeView === "dashboard" && (
              <DashboardOverview
                loading={loading}
                error={error}
                totalSpent={totalSpent}
                totalTransactionsCount={totalTransactionsCount}
                amountsByCategory={amountsByCategory}
                barWidth={barWidth}
                fmt={fmt}
                onAddTransactionClick={openExpenseModal}
                onAddIncomeClick={openIncomeModal}
                onCategoryClick={openCategoryPage}
              />
            )}

            {activeView === "category" && activeCategoryView && (
              <CategoryPage
                category={activeCategoryView}
                transactions={categoryTransactions}
                total={totalCategorySpent}
                onBack={closeCategoryPage}
              />
            )}

            {activeView === "spendings" && <Spendings />}

            {activeView === "budgets" && (
              <Budgets
                budgets={budgets}
                transactions={transactions}
                loading={loading}
                error={error}
                onCreateBudget={handleCreateBudget}
              />
            )}

            {activeView === "calendar" && (
              <section className="calendar-page">
                <header className="panel-header">
                  <h1>Spending scrapbook</h1>
                  <p className="muted">
                    Tap a day to log a picture and how much you spent. Total
                    logged here: € {fmt(totalCalendarLogged)}
                  </p>
                </header>

                <div className="calendar-wrapper">
                  <Calendar
                    entries={calendarEntries}
                    onEntriesChange={setCalendarEntries}
                  />
                </div>
              </section>
            )}

            {/* Expense modal */}
            <AddTransactionModal
              open={showAddForm}
              newTx={newTx}
              setNewTx={setNewTx}
              saving={savingTx}
              error={formError}
              onClose={() => setShowAddForm(false)}
              onSubmit={handleAddTransaction}
            />

            {/* Income modal */}
            <AddIncomeModal
              open={showIncomeForm}
              incomeTx={incomeTx}
              setIncomeTx={setIncomeTx}
              saving={savingIncome}
              error={incomeError}
              onClose={() => setShowIncomeForm(false)}
              onSubmit={handleAddIncome}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
