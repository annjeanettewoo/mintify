const express = require('express');
const router = express.Router();

// demo route *temp*
router.get('/finance/demo', (req, res) => {
    res.json({
        message: 'Finance-service demo endpoint.',
        data: [],
    });
});

module.exports = router;