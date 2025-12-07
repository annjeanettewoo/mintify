// src/components/Calendar.jsx
import { useState, useEffect } from "react";

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// entries shape example:
// {
//   "2025-03-01": { amount: 25.5, imageUrl: "blob:..." },
//   "2025-03-02": { amount: 10, imageUrl: null }
// }

export default function Calendar({ entries = {}, onEntriesChange }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [activeDate, setActiveDate] = useState(null); // "YYYY-MM-DD"
  const [modalAmount, setModalAmount] = useState("");
  const [modalFile, setModalFile] = useState(null);
  const [modalPreview, setModalPreview] = useState(null);

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

  // ----- modal open for a day -----
  const openModalForDay = (day) => {
    if (!day) return;
    const d = new Date(currentYear, currentMonth, day);
    const dateStr = d.toISOString().slice(0, 10);

    const existing = entries[dateStr];
    setActiveDate(dateStr);
    setModalAmount(existing?.amount ?? "");
    setModalPreview(existing?.imageUrl ?? null);
    setModalFile(null);
  };

  const closeModal = () => {
    setActiveDate(null);
    setModalAmount("");
    setModalFile(null);
    setModalPreview(null);
  };

  // update preview when a new file is selected
  useEffect(() => {
    if (!modalFile) return;
    const objectUrl = URL.createObjectURL(modalFile);
    setModalPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [modalFile]);

  const handleSave = () => {
    if (!activeDate) return;

    const newEntries = { ...entries };
    const prev = entries[activeDate] || {};

    newEntries[activeDate] = {
      amount:
        modalAmount === "" || isNaN(Number(modalAmount))
          ? null
          : Number(modalAmount),
      imageUrl: modalFile
        ? modalPreview // blob URL
        : prev.imageUrl ?? modalPreview ?? null,
    };

    onEntriesChange?.(newEntries);
    closeModal();
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
              const dateStr = cellDate.toISOString().slice(0, 10);
              const isToday = isSameDay(cellDate, today);
              const data = entries[dateStr];

              const cellClasses = [
                "calendar-cell",
                isToday ? "today" : "",
                data ? "has-entry" : "",
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

                  {data?.imageUrl && (
                    <img
                      src={data.imageUrl}
                      alt=""
                      className="calendar-photo"
                    />
                  )}

                  {data?.amount != null && (
                    <div className="calendar-amount">
                      ${data.amount.toFixed(0)}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* simple modal */}
      {activeDate && (
        <div className="calendar-modal-backdrop">
          <div className="calendar-modal">
            <h3>Edit {activeDate}</h3>

            <label className="modal-label">
              Amount spent
              <input
                type="number"
                min="0"
                step="0.01"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
              />
            </label>

            <label className="modal-label">
              Photo for the day
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setModalFile(e.target.files[0])}
              />
            </label>

            {modalPreview && (
              <div className="modal-preview-wrapper">
                <img
                  src={modalPreview}
                  alt="Preview"
                  className="modal-preview-image"
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
