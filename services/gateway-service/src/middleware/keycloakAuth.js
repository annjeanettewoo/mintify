// services/gateway-service/src/middleware/keycloakAuth.js

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const KEYCLOAK_JWKS_URL = process.env.KEYCLOAK_JWKS_URL;
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER;
const KEYCLOAK_AUDIENCE = process.env.KEYCLOAK_AUDIENCE;

console.log('[auth-init] Configuration:', {
  jwksUrl: KEYCLOAK_JWKS_URL,
  issuer: KEYCLOAK_ISSUER,
  audience: KEYCLOAK_AUDIENCE,
  authRequired: process.env.AUTH_REQUIRED,
  allowDevUser: process.env.ALLOW_DEV_USER,
});

function authRequired() {
  // default = true unless explicitly set to "false"
  return process.env.AUTH_REQUIRED !== 'false';
}

function allowDevUser() {
  return process.env.ALLOW_DEV_USER === 'true';
}

let client = null;

if (KEYCLOAK_JWKS_URL) {
  client = jwksClient({
    jwksUri: KEYCLOAK_JWKS_URL,
  });
}

function getKey(header, callback) {
  if (!client) {
    return callback(new Error('JWKS client not configured'));
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('[auth] Failed to fetch signing key:', err.message);
      return callback(err);
    }
    callback(null, key.getPublicKey());
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    const options = {
      algorithms: ['RS256'],
    };

    if (KEYCLOAK_ISSUER) options.issuer = KEYCLOAK_ISSUER;
    if (KEYCLOAK_AUDIENCE) options.audience = KEYCLOAK_AUDIENCE;

    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

// =========================
// AUTH MIDDLEWARE
// =========================
async function keycloakAuth(req, res, next) {
  const required = authRequired();

  const authHeader = req.headers.authorization || '';
  const hasBearer = authHeader.startsWith('Bearer ');

  // --------------------------------------------------
  // 1) Bearer token present → try Keycloak verification
  // --------------------------------------------------
  if (hasBearer && client) {
    const token = authHeader.substring('Bearer '.length).trim();

    try {
      const decoded = await verifyToken(token);

      const userId =
        decoded.sub ||
        decoded.preferred_username ||
        decoded.email ||
        'unknown-user';

      console.log('[auth] token valid, userId =', userId);

      req.user = {
        id: userId,
        tokenPayload: decoded,
      };

      return next();
    } catch (err) {
      console.error('[auth] Token verification failed:', err.message);

      // 🔑 IMPORTANT: auth OFF → DO NOT BLOCK
      if (!required) {
        req.user = null;
        return next();
      }

      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // --------------------------------------------------
  // 2) No token → dev/demo user if enabled
  // --------------------------------------------------
  if (allowDevUser()) {
    const headerUserId = req.headers['x-user-id'];
    const userId = headerUserId || 'demo-user';

    console.log('[auth] dev mode userId =', userId);

    req.user = {
      id: userId,
      tokenPayload: null,
    };

    return next();
  }

  // --------------------------------------------------
  // 3) Auth disabled → allow anonymous
  // --------------------------------------------------
  if (!required) {
    req.user = null;
    return next();
  }

  // --------------------------------------------------
  // 4) Auth required → block
  // --------------------------------------------------
  return res.status(401).json({ error: 'Authentication required' });
}

module.exports = { keycloakAuth };
