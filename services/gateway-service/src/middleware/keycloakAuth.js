// src/middleware/
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const KEYCLOAK_JWKS_URL = process.env.KEYCLOAK_JWKS_URL;
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER;
const KEYCLOAK_AUDIENCE = process.env.KEYCLOAK_AUDIENCE;

console.log('[auth-init] Configuration:', {
    jwksUrl: KEYCLOAK_JWKS_URL,
    issuer: KEYCLOAK_ISSUER,
    audience: KEYCLOAK_AUDIENCE,
    allowDev: process.env.ALLOW_DEV_USER
});

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
            console.error(`[auth] Error fetching signing key for kid "${header.kid}":`, err.message);
            return callback(err);
        }
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

function verifyToken(token) {
    return new Promise((resolve, reject) => {
        const options = {
            algorithms: ['RS256'],
        };

        if (KEYCLOAK_ISSUER) {
            options.issuer = KEYCLOAK_ISSUER;
        }
        if (KEYCLOAK_AUDIENCE) {
            options.audience = KEYCLOAK_AUDIENCE;
        }

        jwt.verify(token, getKey, options, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded);
        });
    });
}

// Auth middleware
async function keycloakAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const hasBearer = authHeader.startsWith('Bearer ');
    // If Authorization: Bearer <token> is present and Keycloak is configured:
    // Read token and verify with Keycloak JWKS
    // Extract user id from token and attach to req.user
    if (hasBearer && client) {
        const token = authHeader.substring('Bearer '.length).trim();

      // --- NEW LOGGING SECTION START ---
      const decodedUntrusted = jwt.decode(token, { complete: true });
      if (decodedUntrusted) {
            const { payload, header } = decodedUntrusted;

            console.log('\n[auth-debug] --- Incoming Token Analysis ---');
            console.log('[auth-debug] Token Header (KID):', header.kid);
            console.log('[auth-debug] Token Payload:', JSON.stringify(payload, null, 2));

            // 1. Detect Issuer Mismatch
            if (KEYCLOAK_ISSUER && payload.iss !== KEYCLOAK_ISSUER) {
                console.warn(`[auth-debug] ⚠️ ISSUER MISMATCH! \n   Expected: "${KEYCLOAK_ISSUER}"\n   Received: "${payload.iss}"`);
            } else {
                console.log(`[auth-debug] Issuer check: MATCH (${payload.iss})`);
            }

            // 2. Detect Audience Mismatch
            // Note: Audience in JWT can be a string or an array of strings
            let audValid = false;
            if (!KEYCLOAK_AUDIENCE) {
                audValid = true; // No audience required by server
            } else if (Array.isArray(payload.aud)) {
                audValid = payload.aud.includes(KEYCLOAK_AUDIENCE);
            } else {
                audValid = payload.aud === KEYCLOAK_AUDIENCE;
            }

            if (!audValid) {
                console.warn(`[auth-debug] ⚠️ AUDIENCE MISMATCH! \n   Expected: "${KEYCLOAK_AUDIENCE}"\n   Received: ${JSON.stringify(payload.aud)}`);
            } else {
                console.log(`[auth-debug] Audience check: MATCH`);
            }
            console.log('[auth-debug] -----------------------------------\n');
        } else {
            console.error('[auth-debug] Failed to decode token structure. Token might be malformed.');
        }
        // --- NEW LOGGING SECTION END ---
      
        try {
            const decoded = await verifyToken(token);

            const userId =
                decoded.sub ||
                decoded.preferred_username ||
                decoded.email ||
                'unknown-user';

            console.log('[auth] token ok, userId =', userId);
            
            req.user = {
                id: userId,
                tokenPayload: decoded,
            };

            return next();
        } catch (err) {
            console.error('Failed to verify Keycloak token.', err);
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
    }

    // If ALLOW_DEV_USER is true:
    // Use x-user-id header or demo-user as a fallback dev user
    if (allowDevUser()) {
        const headerUserId = req.headers['x-user-id'];
        const userId = headerUserId || 'demo-user';

        console.log('[auth] dev mode, userId =', userId);
        
        req.user = {
            id: userId,
            tokenPayload: null,
        };

        return next();
    }

    return res.status(401).json({ error: 'Authentication required.' });
}

module.exports = { keycloakAuth };
