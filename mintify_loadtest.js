import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Rate } from "k6/metrics";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "60s", target: 20 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // overall guardrails
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<1200"],

    // endpoint-level thresholds (THIS is what makes bottleneck obvious)
    "http_req_duration{endpoint:budgets}": ["p(95)<900"],
    "http_req_duration{endpoint:transactions_list}": ["p(95)<900"],
    "http_req_duration{endpoint:create_transaction}": ["p(95)<1200"],
    "http_req_duration{endpoint:spending_summary}": ["p(95)<1200"],

    // optional: endpoint error-rate thresholds
    "http_req_failed{endpoint:budgets}": ["rate<0.03"],
    "http_req_failed{endpoint:transactions_list}": ["rate<0.03"],
    "http_req_failed{endpoint:create_transaction}": ["rate<0.03"],
    "http_req_failed{endpoint:spending_summary}": ["rate<0.03"],
  },
};

const BASE = __ENV.BASE_URL || "https://gateway.ltu-m7011e-9.se";
const TOKEN = __ENV.TOKEN;

function authHeaders() {
  return {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  };
}

// Custom metrics (nice for report screenshots + clear summary)
const tBudgets = new Trend("mintify_budgets_ms");
const tTxList = new Trend("mintify_transactions_list_ms");
const tCreateTx = new Trend("mintify_create_transaction_ms");
const tSummary = new Trend("mintify_spending_summary_ms");

const rPostFail = new Rate("mintify_create_transaction_fail_rate");

function timedRequest(name, fn, trend, endpointTag) {
  const res = fn();

  // Tag this request so Grafana/k6 output can split by endpoint
  // NOTE: tags must be attached at request-time, so we do it inside each call below
  trend.add(res.timings.duration);

  return res;
}

export default function () {
  if (!TOKEN) {
    throw new Error(
      "Missing TOKEN env var. Run with: k6 run -e TOKEN=... mintify_loadtest.js"
    );
  }

  const paramsBudgets = { ...authHeaders(), tags: { endpoint: "budgets" } };
  const paramsTxList = { ...authHeaders(), tags: { endpoint: "transactions_list" } };
  const paramsCreate = { ...authHeaders(), tags: { endpoint: "create_transaction" } };
  const paramsSummary = { ...authHeaders(), tags: { endpoint: "spending_summary" } };

  group("1) GET budgets", () => {
    const r1 = http.get(`${BASE}/api/budgets`, paramsBudgets);
    tBudgets.add(r1.timings.duration);

    check(r1, { "GET /api/budgets 200": (r) => r.status === 200 });
  });

  group("2) GET transactions list", () => {
    const r2 = http.get(`${BASE}/api/transactions`, paramsTxList);
    tTxList.add(r2.timings.duration);

    check(r2, { "GET /api/transactions 200": (r) => r.status === 200 });
  });

  group("3) POST create transaction", () => {
    const payload = JSON.stringify({
      type: "expense",
      amount: 1,
      category: "food",
      description: "k6 load test",
      date: new Date().toISOString(),
    });

    const r3 = http.post(`${BASE}/api/transactions`, payload, paramsCreate);
    tCreateTx.add(r3.timings.duration);

    const ok = check(r3, {
      "POST /api/transactions 2xx": (r) => r.status >= 200 && r.status < 300,
    });

    rPostFail.add(!ok);

    // Reduce spam: only log when failed
    if (!ok) {
      console.log(
        `POST /api/transactions FAILED -> status=${r3.status} body=${String(r3.body).slice(0, 300)}`
      );
    }
  });

  group("4) GET spending summary", () => {
    const r4 = http.get(`${BASE}/api/summary/spending?days=30`, paramsSummary);
    tSummary.add(r4.timings.duration);

    check(r4, { "GET /api/summary/spending 200": (r) => r.status === 200 });
  });

  // small think time (keep it stable; you can randomize later if needed)
  sleep(1);
}
