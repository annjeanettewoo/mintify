// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/mintify-logo.png";
import Spendings from "./Spendings";
import Budgets from "./Budgets";
import Calendar from "./Calendar/Calendar.jsx";

import DashboardOverview from "./dashboard/DashboardOverview";
import CategoryPage from "./dashboard/CategoryPage";
import AddTransactionModal from "./dashboard/AddTransactionModal";
// Removed AddIncomeModal import

import useNotifications from "../hooks/useNotif"; 

import {
  fetchBudgets,
  fetchTransactions,
  createTransaction,
  createBudget,
} from "../services/financeApi";

const todayISO = () => new Date().toISOString().slice(0, 10);

function Dashboard({ onLogout, userName }) {
  useNotifications();
  const navigate = useNavigate();

  // Persist View
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem("mintify_active_view") || "dashboard";
  });
  
  useEffect(() => {
    localStorage.setItem("mintify_active_view", activeView);
  }, [activeView]);

  const [activeCategoryView, setActiveCategoryView] = useState(null);

  // --- STATE ---
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [successMsg, setSuccessMsg] = useState(null);

  // --- MODALS ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newTx, setNewTx] = useState({ amount: "", type: "expense", category: "Food", description: "", date: todayISO() });

  // Removed Income Modal State

  // --- DATA FETCHING ---
  const fetchAllData = async () => {
    try {
      console.log("売 Fetching fresh data...");
      const [budgetsRes, transactionsRes] = await Promise.all([
        fetchBudgets(),
        fetchTransactions(),
      ]);
      
      if (Array.isArray(budgetsRes)) setBudgets([...budgetsRes]);
      if (Array.isArray(transactionsRes)) setTransactions([...transactionsRes]);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    const performInitialLoad = async () => {
      try {
        setInitialLoading(true);
        await fetchAllData();
      } catch (err) {
        setError("Could not load data.");
      } finally {
        setInitialLoading(false);
      }
    };
    performInitialLoad();
  }, []);

  // --- SYNC LISTENERS ---
  useEffect(() => {
    const handleRealtimeUpdate = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchAllData();
    };

    const bc = new BroadcastChannel('mintify_sync');
    bc.onmessage = (event) => {
      if (event.data === 'refresh') {
        console.log("藤 Cross-tab signal received: Refreshing");
        fetchAllData();
      }
    };

    window.addEventListener("mintify:data-updated", handleRealtimeUpdate);
    
    return () => {
      window.removeEventListener("mintify:data-updated", handleRealtimeUpdate);
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

  const handleTransactionUpdate = (updatedTx) => {
    if (!updatedTx) return;
    setTransactions((prevTransactions) => 
      prevTransactions.map((tx) => {
        const txId = tx._id || tx.id;
        const updatedId = updatedTx._id || updatedTx.id;
        if (txId && updatedId && txId === updatedId) {
          return { ...tx, ...updatedTx };
        }
        return tx;
      })
    );
  };

  const handleTransactionDelete = (deletedId) => {
    setTransactions((prevTransactions) => 
      prevTransactions.filter((tx) => (tx._id || tx.id) !== deletedId)
    );
  };

  // --- HANDLERS ---
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      setSavingTx(true);
      const res = await createTransaction({ ...newTx, amount: Number(newTx.amount) });
      
      const isToday = newTx.date === todayISO();
      const optimisticDate = isToday ? new Date().toISOString() : newTx.date;
      
      const createdTx = res || { 
        ...newTx, 
        amount: Number(newTx.amount), 
        date: optimisticDate,
        _id: `temp-${Date.now()}` 
      };
      
      setTransactions((prev) => [createdTx, ...prev]);
      setShowAddForm(false);
      setNewTx({ amount: "", type: "expense", category: "Food", description: "", date: todayISO() });
      
      showSuccess("統 Transaction added");
      broadcastUpdate(); 

    } catch (err) {
      setFormError("Failed to save.");
    } finally {
      setSavingTx(false);
    }
  };

  // Removed handleAddIncome

  const handleCreateBudget = async (budgetPayload) => {
    await createBudget(budgetPayload);
    await fetchAllData();
    showSuccess("投 Budget created");
    broadcastUpdate();
  };

  // --- RENDER ---
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const expenseTransactions = safeTransactions.filter((t) => t.type === "expense");
  const totalSpent = expenseTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalTransactionsCount = safeTransactions.length;
  
  const categories = ["Food", "Groceries", "Entertainment", "Travel", "Shopping"];
  const amountsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = expenseTransactions.filter((t) => t.category === cat).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    return acc;
  }, {});
  
  const maxCategoryAmount = Math.max(...Object.values(amountsByCategory), 1);
  const barWidth = (cat) => `${Math.round(((amountsByCategory[cat] || 0) / maxCategoryAmount) * 100)}%`;
  const fmt = (num) => (typeof num === "number" ? num.toFixed(2) : "0.00");

  const categoryTransactions = useMemo(() => {
    if (!activeCategoryView) return [];
    return expenseTransactions.filter((t) => (t.category || "Other") === activeCategoryView);
  }, [activeCategoryView, expenseTransactions]);

  const totalCategorySpent = useMemo(() => 
    categoryTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0), 
  [categoryTransactions]);

  // --- COMPARE TO LAST MONTH ---
  const comparisonText = useMemo(() => {
    const now = new Date();
    // Last month calculation
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthISO = lastMonthDate.toISOString().slice(0, 7); // YYYY-MM
    
    const lastMonthSpent = expenseTransactions
      .filter(t => t.date && t.date.startsWith(lastMonthISO))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    if (totalSpent > lastMonthSpent) return "You are spending more than last month";
    if (totalSpent < lastMonthSpent) return "You are spending less than last month";
    return "You are spending equal to last month";
  }, [expenseTransactions, totalSpent]);


  return (
    <div className="app">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo"><img src={logo} alt="Mintify" /><span className="brand-name">mintify</span></div>
          <nav className="sidebar-nav">
             <button className={`nav-item ${activeView === "dashboard" ? "active" : ""}`} onClick={() => setActiveView("dashboard")}>Dashboard</button>
             <button className={`nav-item ${activeView === "spendings" ? "active" : ""}`} onClick={() => setActiveView("spendings")}>Spendings</button>
             <button className={`nav-item ${activeView === "budgets" ? "active" : ""}`} onClick={() => setActiveView("budgets")}>Budgets</button>
             <button className={`nav-item ${activeView === "calendar" ? "active" : ""}`} onClick={() => setActiveView("calendar")}>Calendar</button>
             <button className="nav-item" onClick={() => navigate("/report/spending")} >Reports</button>
          </nav>
          <button className="logout-btn" onClick={onLogout}>Log out</button>
        </aside>

        <div className="content">
          <header className="topbar">
            <div className="search-wrapper"><input type="text" className="search-input" placeholder="Search..." /></div>
            <div className="topbar-right"><div className="name-tag-widget"><div className="name-tag-box">{(userName || "Guest").toUpperCase()}</div></div></div>
          </header>

          <main className="main">
            {error && <div className="error-banner">{error}</div>}
            
            {successMsg && (
                <div style={{
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "1px solid #c3e6cb",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  {successMsg}
                </div>
            )}

            {activeView === "dashboard" && (
              <DashboardOverview
                loading={initialLoading}
                error={error}
                totalSpent={totalSpent}
                totalTransactionsCount={totalTransactionsCount}
                amountsByCategory={amountsByCategory}
                barWidth={barWidth}
                fmt={fmt}
                onAddTransactionClick={() => setShowAddForm(true)}
                // Removed onAddIncomeClick
                spendingMsg={comparisonText} // ✅ NEW PROP PASSED HERE
                onCategoryClick={(cat) => { setActiveCategoryView(cat); setActiveView("category"); }}
                onViewReports={() => navigate("/report/spending")}
              />
            )}

            {activeView === "spendings" && (
              <Spendings 
                transactions={transactions} 
                loading={initialLoading} 
                error={error} 
                onTransactionUpdate={handleTransactionUpdate}
                onTransactionDelete={handleTransactionDelete}
              />
            )}

            {activeView === "budgets" && (
              <Budgets
                budgets={budgets}
                transactions={transactions}
                loading={initialLoading}
                error={error}
                onCreateBudget={handleCreateBudget}
              />
            )}

            {activeView === "category" && activeCategoryView && (
              <CategoryPage
                category={activeCategoryView}
                transactions={categoryTransactions}
                total={totalCategorySpent}
                onBack={() => { setActiveCategoryView(null); setActiveView("dashboard"); }}
              />
            )}
            
             {activeView === "calendar" && (
               <div className="calendar-page"><Calendar transactions={transactions} /></div>
            )}

            <AddTransactionModal
              open={showAddForm}
              newTx={newTx}
              setNewTx={setNewTx}
              saving={savingTx}
              error={formError}
              onClose={() => setShowAddForm(false)}
              onSubmit={handleAddTransaction}
            />

            {/* Removed AddIncomeModal Component */}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;