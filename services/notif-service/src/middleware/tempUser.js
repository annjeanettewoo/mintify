// Temporary middleware to simulate authenticated user
function tempUser(req, res, next) {
    const allowDevUser = process.env.ALLOW_DEV_USER === 'true';

    // Prefer gateway-propagated identity
    const headerUserId = req.headers['x-user-id'];

    if (headerUserId) {
        req.user = { id: headerUserId };
        return next();
    }

    // Dev fallback only when explicitly enabled
    if (allowDevUser) {
        req.user = { id: 'demo-user' };
        return next();
    }

    return res.status(401).json({ error: 'Missing user identity.' });
};

module.exports = tempUser;