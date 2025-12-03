// src/pages/Spendings.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchTransactions } from "../services/financeApi";
import "./Spendings.css";

function Spendings() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [periodLabel] = useState("This month"); // you can add a real filter later

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTransactions();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load transactions:", err);
        setError("Could not load transactions");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // --- Derived values ---

  const totals = useMemo(() => {
    if (!transactions.length) {
      return {
        total: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        byCategory: {},
      };
    }

    const byCategory = {};
    let total = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;

      // Here we assume expenses are positive numbers.
      // If your backend uses negative for expenses, use Math.abs(amount).
      total += amount;

      const cat = tx.category || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    });

    // Very rough breakdown – adjust if you have real date ranges
    const daily = total / 30;
    const weekly = total / 4;
    const monthly = total;

    return { total, daily, weekly, monthly, byCategory };
  }, [transactions]);

  const latestTransactions = useMemo(
    () => transactions.slice(0, 6),
    [transactions]
  );

  const categoryList = useMemo(() => {
    const entries = Object.entries(totals.byCategory);
    if (!entries.length) return [];
    const max = Math.max(...entries.map(([_, v]) => v || 0)) || 1;

    return entries.map(([name, value]) => ({
      name,
      value,
      barWidth: (value / max) * 100,
    }));
  }, [totals.byCategory]);

  return (
    <div className="spendings-page">
      <header className="spendings-header">
        <div>
          <h1>Spendings</h1>
          <p className="spendings-subtitle">
            Overview of your expenses and recent transactions.
          </p>
        </div>

        <button className="period-pill">
          {periodLabel}
          <span className="period-pill-caret">▾</span>
        </button>
      </header>

      {loading && <p className="spendings-status">Loading spendings…</p>}
      {error && <p className="spendings-status error">{error}</p>}

      {!loading && !error && (
        <div className="spendings-grid">
          {/* Top row summary cards */}
          <section className="card summary-card">
            <div className="summary-header">
              <span className="summary-label">All expenses</span>
              <span className="summary-period">{periodLabel}</span>
            </div>
            <div className="summary-main-amount">
              € {totals.total.toFixed(2)}
            </div>
            <div className="summary-breakdown">
              <div>
                <span className="summary-breakdown-label">Daily</span>
                <span className="summary-breakdown-value">
                  € {totals.daily.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="summary-breakdown-label">Weekly</span>
                <span className="summary-breakdown-value">
                  € {totals.weekly.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="summary-breakdown-label">Monthly</span>
                <span className="summary-breakdown-value">
                  € {totals.monthly.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          <section className="card helper-card">
            <h2>Standing orders</h2>
            <p>
              Set up recurring payments for rent, subscriptions or savings so
              you never miss a payment.
            </p>
            <button className="primary-outline-btn">
              Define standing order
            </button>
          </section>

          {/* Bottom row: latest transactions + category breakdown */}
          <section className="card latest-txs-card">
            <div className="card-header-row">
              <h2>Latest transactions</h2>
            </div>

            {latestTransactions.length === 0 ? (
              <p className="empty-state">No transactions yet.</p>
            ) : (
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="tx-amount-col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {latestTransactions.map((tx) => (
                    <tr key={tx._id || tx.id}>
                      <td>{tx.date ? tx.date.slice(0, 10) : "—"}</td>
                      <td>{tx.description || "—"}</td>
                      <td>
                        <span className="tx-category-pill">
                          {tx.category || "Other"}
                        </span>
                      </td>
                      <td className="tx-amount-col">
                        <span className="tx-amount">
                          € {(Number(tx.amount) || 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button className="link-button">See more →</button>
          </section>

          <section className="card category-card">
            <div className="card-header-row">
              <h2>Expenses by category</h2>
            </div>

            {categoryList.length === 0 ? (
              <p className="empty-state">No category data yet.</p>
            ) : (
              <div className="category-list">
                {categoryList.map((cat) => (
                  <div key={cat.name} className="category-row">
                    <div className="category-row-top">
                      <span className="category-name">{cat.name}</span>
                      <span className="category-value">
                        € {cat.value.toFixed(2)}
                      </span>
                    </div>
                    <div className="category-bar-bg">
                      <div
                        className="category-bar-fill"
                        style={{ width: `${cat.barWidth}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Spendings;
