// src/pages/SpendingReport.jsx
import { useEffect, useMemo, useState } from "react";
// 1. Import useNavigate for the back button
import { useNavigate } from "react-router-dom"; 
import keycloak from "../services/keycloak";

import { fetchSpendingSummary } from "../services/summaryApi";
import { fetchSpendingAdvice } from "../services/adviceApi";

// Charts
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// 2. Define a color palette for the Pie Chart
const COLORS = [
  "#D9534F", // Red (Food)
  "#F7D766", // Yellow (Groceries)
  "#e8d5ff", // Purple (Shopping)
  "#8ab6ff", // Blue (Entertainment)
  "#c7e8b3", // Green (Travel)
];

function formatMoney(n) {
  const val = Number(n || 0);
  // 3. Changed currency from SGD to EUR
  return val.toLocaleString(undefined, { style: "currency", currency: "EUR" });
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SpendingReport() {
  // 1. Initialize navigation
  const navigate = useNavigate();
  const [days, setDays] = useState(30);

  // Spending summary state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  // AI coach state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiData, setAiData] = useState(null); 
  const [showSummary, setShowSummary] = useState(false);

  // Always get a fresh token before calling backend
  async function getFreshToken() {
    if (!keycloak?.authenticated) return null;
    try {
      await keycloak.updateToken(30);
      return keycloak.token || null;
    } catch (e) {
      console.error("Failed to refresh token:", e);
      return keycloak.token || null; 
    }
  }

  // Load spending summary when days changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        if (!keycloak?.authenticated) {
          throw new Error("Not logged in. Please sign in again.");
        }

        const token = await getFreshToken();
        const summary = await fetchSpendingSummary({ days, token });

        if (!cancelled) setData(summary);
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load spending summary.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const categories = data?.byCategory || [];
  const total = data?.totalExpenses ?? 0;

  const chartData = useMemo(() => {
    return categories.map((c) => ({
      name: c.category,
      value: Number(c.amount || 0),
      percentage: Number(c.percentage || 0),
    }));
  }, [categories]);

  async function handleGenerateAdvice() {
    setAiLoading(true);
    setAiError("");

    try {
      if (!keycloak?.authenticated) {
        throw new Error("Not logged in. Please sign in again.");
      }

      const token = await getFreshToken();
      const result = await fetchSpendingAdvice({ days, token });

      setAiData(result);
      setShowSummary(false);
    } catch (e) {
      setAiError(e?.message || "Failed to generate AI advice.");
      setAiData(null);
      setShowSummary(false);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleCopyAdvice() {
    if (!aiData?.advice) return;
    try {
      await navigator.clipboard.writeText(aiData.advice);
    } catch {
      // no-op
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* 1. Header with Back Button */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => navigate("/dashboard")} // Change "/dashboard" if your route is named differently
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
            fontSize: "14px",
            padding: 0,
            textDecoration: "underline"
          }}
        >
          &larr; Back to Dashboard
        </button>
        
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ margin: 0 }}>Spending Report</h1>
          <p style={{ margin: 0, opacity: 0.7 }}>
            Summary + category breakdown + AI tips
          </p>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Period (days):
          <select
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setAiData(null);
              setAiError("");
              setShowSummary(false);
            }}
            style={{ padding: "6px 10px", borderRadius: 8 }}
          >
            <option value={7}>Last 7</option>
            <option value={14}>Last 14</option>
            <option value={30}>Last 30</option>
            <option value={60}>Last 60</option>
            <option value={90}>Last 90</option>
          </select>
        </label>

        {data?.period && (
          <span style={{ opacity: 0.75 }}>
            From <b>{formatDate(data.period.from)}</b> to{" "}
            <b>{formatDate(data.period.to)}</b>
          </span>
        )}
      </div>

      {/* Status */}
      {loading && (
        <div style={{ marginTop: 18, opacity: 0.8 }}>Loading…</div>
      )}

      {err && (
        <div
          style={{
            marginTop: 18,
            padding: 12,
            borderRadius: 12,
            background: "#fff3f3",
            border: "1px solid #ffd1d1",
          }}
        >
          <b>Couldn’t load report.</b>
          <div style={{ marginTop: 6 }}>{err}</div>
          <div style={{ marginTop: 6, opacity: 0.8, fontSize: 14 }}>
            If you’re logged in but still seeing this, it’s usually a token/CORS
            issue. Check DevTools → Network for 401 / CORS errors.
          </div>
        </div>
      )}

      {/* Main */}
      {data && !loading && !err && (
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {/* Total */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 16,
              padding: 16,
              background: "white",
            }}
          >
            <div style={{ opacity: 0.7, fontSize: 14 }}>Total expenses</div>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>
              {formatMoney(total)}
            </div>
            <div style={{ marginTop: 10, opacity: 0.75 }}>
              Categories: <b>{categories.length}</b>
            </div>
          </div>

          {/* Pie chart */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 16,
              padding: 16,
              background: "white",
              minHeight: 260,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              By category (share)
            </div>

            {chartData.length === 0 ? (
              <div style={{ opacity: 0.7, marginTop: 10 }}>
                No expenses in this period.
              </div>
            ) : (
              <div style={{ width: "100%", height: 230 }}>
                <ResponsiveContainer>
                  {/* Kept margins to prevent labels from being cut off */}
                  <PieChart margin={{ top: 30, bottom: 30, left: 20, right: 20 }}>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      label={(entry) =>
                        `${entry.name} (${Number(entry.percentage || 0).toFixed(
                          1
                        )}%)`
                      }
                    >
                      {chartData.map((_, idx) => (
                        <Cell 
                          key={`cell-${idx}`} 
                          fill={COLORS[idx % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatMoney(value), name]}
                    />
                    {/* <Legend /> has been removed */}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Table */}
          <div
            style={{
              gridColumn: "1 / -1",
              border: "1px solid #eee",
              borderRadius: 16,
              padding: 16,
              background: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 600 }}>Category breakdown</div>
              <div style={{ opacity: 0.7, fontSize: 14 }}>
                Sorted by amount (desc)
              </div>
            </div>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.8 }}>
                    <th
                      style={{
                        padding: "10px 8px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      Category
                    </th>
                    <th
                      style={{
                        padding: "10px 8px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      Amount
                    </th>
                    <th
                      style={{
                        padding: "10px 8px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td style={{ padding: 12, opacity: 0.7 }} colSpan={3}>
                        No expenses in this period.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.category}>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderBottom: "1px solid #f3f3f3",
                          }}
                        >
                          {c.category}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderBottom: "1px solid #f3f3f3",
                          }}
                        >
                          {formatMoney(c.amount)}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderBottom: "1px solid #f3f3f3",
                          }}
                        >
                          {Number(c.percentage || 0).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
              Source: <code>/api/summary/spending?days={days}</code>
            </div>
          </div>

          {/* AI Coach */}
          <div
            style={{
              gridColumn: "1 / -1",
              border: "1px solid #eee",
              borderRadius: 16,
              padding: 16,
              background: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>AI Coach</div>
                <div style={{ opacity: 0.75, marginTop: 4, fontSize: 14 }}>
                  Get 3–5 actionable tips based on your last {days} days of
                  spending.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={handleGenerateAdvice}
                  disabled={aiLoading}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: aiLoading ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {aiLoading ? "Generating…" : "Generate advice"}
                </button>

                <button
                  onClick={() => {
                    setAiData(null);
                    setAiError("");
                    setShowSummary(false);
                  }}
                  disabled={!aiData || aiLoading}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #eee",
                    background: "#fafafa",
                    cursor: !aiData || aiLoading ? "not-allowed" : "pointer",
                  }}
                  title="Clear advice"
                >
                  Clear
                </button>
              </div>
            </div>

            {aiError && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: "#fff3f3",
                  border: "1px solid #ffd1d1",
                }}
              >
                <b>AI advice unavailable.</b>
                <div style={{ marginTop: 6 }}>{aiError}</div>
                <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
                  If this keeps happening, check your backend environment
                  variables: <code>AI_API_URL</code> and <code>AI_API_KEY</code>.
                </div>
              </div>
            )}

            {!aiError && aiData && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid #f0f0f0",
                    background: "#fcfcfc",
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {aiData.advice}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={handleCopyAdvice}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    Copy advice
                  </button>

                  <button
                    onClick={() => setShowSummary((s) => !s)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid #eee",
                      background: "#fafafa",
                      cursor: "pointer",
                    }}
                  >
                    {showSummary ? "Hide summary" : "Show summary sent to AI"}
                  </button>
                </div>

                {showSummary && (
                  <pre
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      background: "#f7f7f7",
                      border: "1px solid #eee",
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {aiData.summary}
                  </pre>
                )}

                <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
                  Source: <code>/api/advice/spending?days={days}</code>
                </div>
              </div>
            )}

            {!aiLoading && !aiError && !aiData && (
              <div style={{ marginTop: 12, opacity: 0.7, fontSize: 14 }}>
                Click “Generate advice” to get suggestions based on your spending
                distribution.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}