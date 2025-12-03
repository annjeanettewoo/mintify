require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const cors = require('cors');

const app = express();
app.use(express.json());

// ---------- CORS ----------
app.use(
  cors({
    origin: [
      'http://localhost:5173',            // local frontend
      'https://mintify.ltu-m7011e-9.se',  // deployed frontend
    ],
    credentials: true,
  })
);

// ---------- SESSION ----------
const memoryStore = new session.MemoryStore();
app.use(
  session({
    secret: 'the-secret-key',
    resave: false,
    saveUninitialized: true, // fixed spelling
    store: memoryStore,
  })
);

// ---------- KEYCLOAK (optional for local) ----------
let keycloak = null;

if (
  process.env.KEYCLOAK_ISSUER_URL &&
  process.env.KEYCLOAK_REALM &&
  process.env.KEYCLOAK_CLIENT_ID
) {
  const kcConfig = {
    realm: process.env.KEYCLOAK_REALM,
    'auth-server-url': process.env.KEYCLOAK_ISSUER_URL.replace(
      `/realms/${process.env.KEYCLOAK_REALM}`,
      ''
    ),
    'ssl-required': 'none',
    resource: process.env.KEYCLOAK_CLIENT_ID,
    'public-client': true,
  };

  keycloak = new Keycloak({ store: memoryStore }, kcConfig);
  console.log('Keycloak initialized');
} else {
  console.warn(
    'Keycloak env vars missing – running auth-service WITHOUT Keycloak. /protected route will be disabled.'
  );
}

// ---------- ROUTES ----------

// health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
  });
});

// protected route only if keycloak is configured
if (keycloak) {
  app.get('/protected', keycloak.protect(), (req, res) => {
    res.json({
      message: 'You accessed a protected route.',
      user: req.kauth.grant.access_token.content,
    });
  });
}

// public route
app.get('/public', (req, res) => {
  res.json({
    message: 'This is public — no token needed.',
  });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`auth-service running on port ${PORT}`);
});
