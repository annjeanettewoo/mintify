// src/pages/Calendar/Calendar.jsx
import { useState, useMemo } from "react";
import "./Calendar.css";


// --- helpers ---
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// format yyyy-mm-dd in LOCAL time (no UTC shift)
function formatYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * transactions prop shape:
 * [
 *   {
 *     id,
 *     amount,
 *     type: "expense" | "income",
 *     category: "Food" | "Groceries" | "Entertainment" | "Travel" | "Shopping" | ...,
 *     description,
 *     date: "2025-12-08"   // ISO date string (no time)
 *   }
 * ]
 */
export default function Calendar({ transactions = [] }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [activeDate, setActiveDate] = useState(null); // "YYYY-MM-DD"
  const [activeTransactions, setActiveTransactions] = useState([]);

  // ----- group transactions by date -----
  const transactionsByDate = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      if (!tx?.date) continue;
      const dateStr = tx.date.slice(0, 10); // handle "2025-12-08T…" too
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(tx);
    }
    return map;
  }, [transactions]);

  // ----- calendar generation -----
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const weeks = [];
  let dayCounter = 1 - startingWeekday;

  for (let week = 0; week < 6; week++) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      if (dayCounter < 1 || dayCounter > daysInMonth) {
        days.push(null);
      } else {
        days.push(dayCounter);
      }
      dayCounter++;
    }
    weeks.push(days);
  }

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString(
    "default",
    { month: "long" }
  );

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // ----- open modal for a day -----
  const openModalForDay = (day) => {
    if (!day) return;
    const d = new Date(currentYear, currentMonth, day);
    const dateStr = formatYMD(d);

    const dayTx = transactionsByDate[dateStr] || [];
    setActiveDate(dateStr);
    setActiveTransactions(dayTx);
  };

  const closeModal = () => {
    setActiveDate(null);
    setActiveTransactions([]);
  };

  return (
    <>
      <div className="calendar">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={handlePrevMonth}>
            ‹
          </button>
          <div className="calendar-title">
            {monthName} {currentYear}
          </div>
          <button className="calendar-nav-btn" onClick={handleNextMonth}>
            ›
          </button>
        </div>

        <div className="calendar-grid">
          {daysOfWeek.map((d) => (
            <div key={d} className="calendar-dow">
              {d}
            </div>
          ))}

          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (!day) {
                return (
                  <div
                    key={`${wi}-${di}`}
                    className="calendar-cell empty"
                  ></div>
                );
              }

              const cellDate = new Date(currentYear, currentMonth, day);
              const dateStr = formatYMD(cellDate);
              const isToday = isSameDay(cellDate, today);
              const dayTx = transactionsByDate[dateStr] || [];

              const cellClasses = [
                "calendar-cell",
                isToday ? "today" : "",
                dayTx.length ? "has-entry" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={`${wi}-${di}`}
                  className={cellClasses}
                  onClick={() => openModalForDay(day)}
                >
                  <div className="calendar-day-number">{day}</div>

                  {/* pretty coloured chips per category */}
                  {dayTx.length > 0 && (
                    <div className="calendar-chips">
                      {dayTx.slice(0, 3).map((tx) => {
                        const category =
                          (tx.category || "Other").toLowerCase();
                        const key = tx.id || tx._id || `${dateStr}-${category}-${tx.amount}`;
                        return (
                          <div
                            key={key}
                            className={`calendar-chip calendar-chip--${category}`}
                          >
                            <span className="calendar-chip-label">
                              {tx.category || "Other"}
                            </span>
                            <span className="calendar-chip-amount">
                              {tx.type === "income" ? "+" : "-"}€
                              {Number(tx.amount || 0).toFixed(0)}
                            </span>
                          </div>
                        );
                      })}
                      {dayTx.length > 3 && (
                        <div className="calendar-chip calendar-chip--more">
                          +{dayTx.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* modal listing transactions for the selected day */}
      {activeDate && (
        <div className="calendar-modal-backdrop">
          <div className="calendar-modal">
            <h3>Transactions on {activeDate}</h3>

            {activeTransactions.length === 0 ? (
              <p>No transactions on this day.</p>
            ) : (
              <ul className="calendar-modal-list">
                {activeTransactions.map((tx) => (
                  <li key={tx.id || tx._id || `${tx.date}-${tx.amount}`}>
                    <div className="modal-tx-row">
                      <span className="modal-tx-main">
                        {tx.category || "Uncategorised"}{" "}
                        {tx.description ? `– ${tx.description}` : ""}
                      </span>
                      <span
                        className={
                          tx.type === "income"
                            ? "modal-tx-amount income"
                            : "modal-tx-amount expense"
                        }
                      >
                        {tx.type === "income" ? "+" : "-"}€
                        {Number(tx.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="modal-actions">
              <button className="modal-btn primary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
