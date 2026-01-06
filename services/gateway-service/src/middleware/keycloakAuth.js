const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const KEYCLOAK_JWKS_URL = process.env.KEYCLOAK_JWKS_URL;
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER;
const KEYCLOAK_AUDIENCE = process.env.KEYCLOAK_AUDIENCE;
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
