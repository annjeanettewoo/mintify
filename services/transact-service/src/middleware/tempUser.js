// temporary middleware to simulate authenticated user
function tempUser(req, res, next) {
    const userId = req.header('x-user-id') || 'demo-user';
    req.user = { id: userId };
    next();
}

module.exports = tempUser;