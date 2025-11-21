// src/pages/Dashboard.jsx
import logo from "../assets/mintify-logo.png";

function Dashboard({ onLogout }) {
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
            <a href="#dashboard" className="nav-item active">
              <span className="nav-dot" />
              <span>Dashboard</span>
            </a>
            <a href="#spendings" className="nav-item">
              <span className="nav-dot" />
              <span>Spendings</span>
            </a>
            <a href="#budgets" className="nav-item">
              <span className="nav-dot" />
              <span>Budgets</span>
            </a>
            <a href="#calendar" className="nav-item">
              <span className="nav-dot" />
              <span>Calendar</span>
            </a>

            <p className="sidebar-section-label">TOOLS</p>
            <a href="#reports" className="nav-item">
              <span className="nav-dot" />
              <span>Reports</span>
            </a>
            <a href="#settings" className="nav-item">
              <span className="nav-dot" />
              <span>Settings</span>
            </a>
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
          <main className="main" id="dashboard">
            <section className="left-panel" id="spendings">
              <header className="panel-header">
                <h1>Your spendings &amp; budgets</h1>
                <p className="muted">
                  Overview of your spending breakdown and budget status for this
                  month.
                </p>
              </header>

              {/* SUMMARY: TOTAL + BAR GRAPH */}
              <div className="summary-row">
                {/* Total spent / donut placeholder */}
                <div className="donut-card">
                  <p className="muted-small">Total spent this month</p>
                  <h2 className="big-amount">€ 2,340</h2>
                  <p className="muted-small">Across 54 transactions</p>

                  <div className="donut-placeholder">
                    Donut chart placeholder
                  </div>

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
                          style={{ width: "35%" }}
                        />
                      </div>
                      <div className="bar-amount">€ 420</div>
                    </div>

                    <div className="bar-row">
                      <div className="bar-label">Groceries</div>
                      <div className="bar-track">
                        <div
                          className="bar-fill groceries"
                          style={{ width: "50%" }}
                        />
                      </div>
                      <div className="bar-amount">€ 610</div>
                    </div>

                    <div className="bar-row">
                      <div className="bar-label">Entertainment</div>
                      <div className="bar-track">
                        <div
                          className="bar-fill entertainment"
                          style={{ width: "15%" }}
                        />
                      </div>
                      <div className="bar-amount">€ 180</div>
                    </div>

                    <div className="bar-row">
                      <div className="bar-label">Travel</div>
                      <div className="bar-track">
                        <div
                          className="bar-fill travel"
                          style={{ width: "25%" }}
                        />
                      </div>
                      <div className="bar-amount">€ 320</div>
                    </div>

                    <div className="bar-row">
                      <div className="bar-label">Shopping</div>
                      <div className="bar-track">
                        <div
                          className="bar-fill shopping"
                          style={{ width: "22%" }}
                        />
                      </div>
                      <div className="bar-amount">€ 310</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORY CARDS AS STAR SHAPES */}
              <div className="spending-cards">
                <div className="spending-card star-card star-food">
                  <p className="card-label">Food</p>
                  <h3>€ 420</h3>
                  <p className="muted-small">Dining out, coffee, snacks</p>
                  <span className="delta-badge up">+2.3% vs last month</span>
                </div>

                <div className="spending-card star-card star-groceries">
                  <p className="card-label">Groceries</p>
                  <h3>€ 610</h3>
                  <p className="muted-small">Supermarket &amp; essentials</p>
                  <span className="delta-badge down">-0.8% vs last month</span>
                </div>

                <div className="spending-card star-card star-entertainment">
                  <p className="card-label">Entertainment</p>
                  <h3>€ 180</h3>
                  <p className="muted-small">Movies, subscriptions, events</p>
                  <span className="delta-badge up">+4.1% vs last month</span>
                </div>

                <div className="spending-card star-card star-travel">
                  <p className="card-label">Travel</p>
                  <h3>€ 320</h3>
                  <p className="muted-small">Flights, trains, transport</p>
                  <span className="delta-badge up">+1.2% vs last month</span>
                </div>

                <div className="spending-card star-card star-shopping">
                  <p className="card-label">Shopping</p>
                  <h3>€ 310</h3>
                  <p className="muted-small">Clothes, gadgets, extras</p>
                  <span className="delta-badge down">-3.0% vs last month</span>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
