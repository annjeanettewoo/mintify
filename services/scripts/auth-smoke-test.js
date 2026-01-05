const axios = require("axios");

const KEYCLOAK_BASE = process.env.KEYCLOAK_BASE || "http://localhost:8080";
const REALM = process.env.KEYCLOAK_REALM || "mintify";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "mintify-dev";
const USERNAME = process.env.KEYCLOAK_USERNAME || "testuser";
const PASSWORD = process.env.KEYCLOAK_PASSWORD || "Test1234!";

const GATEWAY_BASE = process.env.GATEWAY_BASE || "http://localhost:4000";

// Direct service ports
const DIRECT_BUDGET = process.env.DIRECT_BUDGET || "http://localhost:4002";
const DIRECT_TRANSACT = process.env.DIRECT_TRANSACT || "http://localhost:4003";
const DIRECT_NOTIF = process.env.DIRECT_NOTIF || "http://localhost:4004";

function ok(msg) {
  console.log(`✅ ${msg}`);
}
function bad(msg) {
  console.error(`❌ ${msg}`);
}

async function getToken() {
  const url = `${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    username: USERNAME,
    password: PASSWORD,
  });

  const resp = await axios.post(url, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    validateStatus: () => true,
  });

  if (resp.status !== 200 || !resp.data?.access_token) {
    throw new Error(
      `Token request failed: status=${resp.status} body=${JSON.stringify(resp.data)}`
    );
  }
  return resp.data.access_token;
}

async function expectStatus(name, fn, expected) {
  const resp = await fn();
  if (resp.status === expected) {
    ok(`${name} -> ${expected}`);
    return resp;
  }
  bad(`${name} -> expected ${expected}, got ${resp.status}`);
  const snippet =
    typeof resp.data === "string"
      ? resp.data.slice(0, 200)
      : JSON.stringify(resp.data).slice(0, 200);
  console.error(`   body: ${snippet}`);
  process.exitCode = 1;
  return resp;
}

async function main() {
  console.log("=== Mintify Auth Smoke Test ===");
  console.log({ KEYCLOAK_BASE, REALM, CLIENT_ID, USERNAME, GATEWAY_BASE });

  const token = await getToken();
  ok("Got access token.");

  // 1) Gateway should reject without token
  await expectStatus(
    "Gateway /api/transactions without token.",
    () => axios.get(`${GATEWAY_BASE}/api/transactions`, { validateStatus: () => true }),
    401
  );

  // 2) Gateway should allow with token
  const auth = { Authorization: `Bearer ${token}` };

  await expectStatus(
    "Gateway /api/transactions with token.",
    () =>
      axios.get(`${GATEWAY_BASE}/api/transactions`, {
        headers: auth,
        validateStatus: () => true,
      }),
    200
  );

  await expectStatus(
    "Gateway /api/budgets with token.",
    () =>
      axios.get(`${GATEWAY_BASE}/api/budgets`, {
        headers: auth,
        validateStatus: () => true,
      }),
    200
  );

  await expectStatus(
    "Gateway /api/notifications with token.",
    () =>
      axios.get(`${GATEWAY_BASE}/api/notifications`, {
        headers: auth,
        validateStatus: () => true,
      }),
    200
  );

  // 3) Downstream direct calls should fail now (missing user identity)
  await expectStatus(
    "Direct budget without x-user-id.",
    () => axios.get(`${DIRECT_BUDGET}/api/budgets`, { validateStatus: () => true }),
    401
  );

  await expectStatus(
    "Direct transact without x-user-id.",
    () => axios.get(`${DIRECT_TRANSACT}/api/transactions`, { validateStatus: () => true }),
    401
  );

  await expectStatus(
    "Direct notif without x-user-id.",
    () => axios.get(`${DIRECT_NOTIF}/api/notifications`, { validateStatus: () => true }),
    401
  );

  console.log("=== Done ===");
  if (!process.exitCode) ok("All checks passed.");
}

main().catch((e) => {
  bad(e.message);
  process.exitCode = 1;
});
