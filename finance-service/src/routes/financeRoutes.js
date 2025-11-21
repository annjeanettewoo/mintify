const express = require('express');
const router = express.Router();

// Placeholder route – we'll replace with real finance logic later
router.get('/finance/demo', (req, res) => {
    res.json({
        message: 'Finance-service demo endpoint.',
        data: [],
    });
});

module.exports = router;