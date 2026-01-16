// src/pages/dashboard/DashboardOverview.jsx

function DashboardOverview({
  loading,
  error,
  totalSpent,
  totalTransactionsCount,
  amountsByCategory,
  barWidth,
  fmt,
  onAddTransactionClick,
  spendingMsg,
  onCategoryClick,
}) {
  return (
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
            Overview of your spending breakdown and budget status for this
            month.
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
              type="button"
              className="add-transaction-btn"
              onClick={onAddTransactionClick}
            >
              + Add transaction
            </button>

            <p style={{ 
              marginTop: "16px", 
              fontSize: "13px", 
              color: "#6b6b6b", 
              fontStyle: "italic",
              fontWeight: "500"
            }}>
              {spendingMsg}
            </p>

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
                  € {fmt(amountsByCategory["Entertainment"] || 0)}
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
                    style={{ width: barWidth("Shopping") }}
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
          <div
            className="spending-card category-card--food"
            onClick={() => onCategoryClick("Food")}
            style={{ cursor: "pointer" }}
          >
            <p className="card-label">Food</p>
            <h3>€ {fmt(amountsByCategory["Food"] || 0)}</h3>
            <p className="muted-small">Dining out, coffee, snacks</p>
          </div>

          <div
            className="spending-card category-card--groceries"
            onClick={() => onCategoryClick("Groceries")}
            style={{ cursor: "pointer" }}
          >
            <p className="card-label">Groceries</p>
            <h3>€ {fmt(amountsByCategory["Groceries"] || 0)}</h3>
            <p className="muted-small">Supermarket &amp; essentials</p>
          </div>

          <div
            className="spending-card category-card--entertainment"
            onClick={() => onCategoryClick("Entertainment")}
            style={{ cursor: "pointer" }}
          >
            <p className="card-label">Entertainment</p>
            <h3>€ {fmt(amountsByCategory["Entertainment"] || 0)}</h3>
            <p className="muted-small">Movies, subscriptions, events</p>
          </div>

          <div
            className="spending-card category-card--travel"
            onClick={() => onCategoryClick("Travel")}
            style={{ cursor: "pointer" }}
          >
            <p className="card-label">Travel</p>
            <h3>€ {fmt(amountsByCategory["Travel"] || 0)}</h3>
            <p className="muted-small">Flights, trains, transport</p>
          </div>

          <div
            className="spending-card category-card--shopping"
            onClick={() => onCategoryClick("Shopping")}
            style={{ cursor: "pointer" }}
          >
            <p className="card-label">Shopping</p>
            <h3>€ {fmt(amountsByCategory["Shopping"] || 0)}</h3>
            <p className="muted-small">Clothes, gadgets, extras</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default DashboardOverview;