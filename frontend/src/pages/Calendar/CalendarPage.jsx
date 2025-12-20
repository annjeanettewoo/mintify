// src/pages/CalendarPage.jsx
import { useEffect, useState } from "react";
import Calendar from "./Calendar.jsx";
import { fetchTransactions } from "../../services/financeApi.js";

export default function CalendarPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchTransactions(); // GET /transactions from backend
        setTransactions(data || []);
      } catch (err) {
        console.error("Failed to load transactions", err);
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="calendar-page">
      <h1>Spending Calendar</h1>

      {loading && <p>Loading transactions…</p>}
      {error && <p style={{ color: "var(--deep-cherry)" }}>{error}</p>}

      {!loading && !error && (
        <Calendar transactions={transactions} />
        // 👆 THIS is the important part
      )}
    </div>
  );
}
