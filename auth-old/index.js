require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');

const app = express();
app.use(express.json());

// session
const memoryStore = new session.MemoryStore();
app.use(
    session({
        secret: 'the-secret-key',
        resave: false,
        saveUninitiliazed: true,
        store: memoryStore,
    })
);

// keycloak config
const kcConfig = {
    realm: process.env.KEYCLOAK_REALM,
    'auth-server-url': process.env.KEYCLOAK_ISSUER_URL.replace(`/realms/${process.env.KEYCLOAK_REALM}`, ''),
    'ssl-required': 'none',
    resource: process.env.KEYCLOAK_CLIENT_ID,
    'public-client': true,
};

const keycloak = new Keycloak({store: memoryStore}, kcConfig);

// health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'auth-service',
    });
});

// PROTECTED route
app.get('/protected', keycloak.protect(), (req, res) => {
    res.json({
        message: 'You accessed a protected route.',
        user: req.kauth.grant.access_token.content
    });
});

// public route
app.get('/public', (req, res) => {
    res.json({
        message: 'This is public — no token needed.'
    });
});

// start server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`auth-service running on port ${PORT}`);
});
