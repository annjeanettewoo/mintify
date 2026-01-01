// Temporary middleware to simulate authenticated user
function tempUser(req, res, next) {
  const allowDevUser = process.env.ALLOW_DEV_USER === 'true';
  const isTestEnv = process.env.NODE_ENV === 'test';

  // Prefer gateway-propagated identity
  const headerUserId = req.headers['x-user-id'];

  if (headerUserId) {
    req.user = { id: headerUserId };
    return next();
  }

  // Test fallback (CI/Jest) so tests don't require gateway headers
  if (isTestEnv) {
    req.user = { id: 'demo-user' };
    return next();
  }

  // Dev fallback only when explicitly enabled
  if (allowDevUser) {
    req.user = { id: 'demo-user' };
    return next();
  }

  return res.status(401).json({ error: 'Missing user identity.' });
}

module.exports = tempUser;
