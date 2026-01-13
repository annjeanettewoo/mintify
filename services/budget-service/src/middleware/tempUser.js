// services/budget-service/src/middleware/tempUser.js
function tempUser(req, res, next) {
  const allowDevUser = process.env.ALLOW_DEV_USER === 'true';

  const headerUserId = req.headers['x-user-id'];
  if (headerUserId) {
    req.user = { id: headerUserId };
    return next();
  }

  if (allowDevUser) {
    req.user = { id: 'demo-user' };
    return next();
  }

  return res.status(401).json({ error: 'Missing user identity.' });
}

module.exports = tempUser;
