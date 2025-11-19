// src/App.jsx
import "./App.css";
import logo from "./assets/mintify-logo.png";

function App() {
  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="navbar-logo">
          <img src={logo} alt="Mintify logo" className="logo-image" />
          <span className="logo-text">mintify</span>
        </div>

        <nav className="navbar-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#budgets">Budgets</a>
          <a href="#transactions">Transactions</a>
          <a href="#profile" className="navbar-cta">
            Profile
          </a>
        </nav>
      </header>

      {/* MAIN SECTION */}
      <main className="main">
        {/* LEFT PANEL */}
        <section className="hero" id="dashboard">
          <h1>HELLO MINTIFY</h1>
          <p className="hero-subtitle">
            Track your spending, manage budgets, and gain financial clarity.
          </p>

          <div className="hero-actions">
            <button className="btn primary">Add Transaction</button>
            <button className="btn secondary">Create Budget</button>
          </div>

          <div className="hero-card">
            <h2>Overview</h2>
            <p>
              This section will later update dynamically with your spending data,
              budget usage, and recommendations from your backend services.
            </p>
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="sidebar">
          <h2>Today's Summary</h2>
          <ul className="stats-list">
            <li>
              <span className="stat-label">Total spent</span>
              <span className="stat-value">€42.80</span>
            </li>
            <li>
              <span className="stat-label">Budgets over limit</span>
              <span className="stat-value">1</span>
            </li>
            <li>
              <span className="stat-label">Pending alerts</span>
              <span className="stat-value">3</span>
            </li>
          </ul>

          <h3 className="sidebar-subtitle">Recent Notifications</h3>
          <ul className="notification-list">
            <li>💳 New transaction at ICA – €18.50</li>
            <li>⚠️ Groceries budget at 85% of limit</li>
            <li>📊 Weekly summary report is ready</li>
          </ul>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Mintify · M7011E Dynamic Web Systems</p>
      </footer>
    </div>
  );
}

export default App;


