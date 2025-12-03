const express = require('express');
const Transaction = require('../models/Transaction');

const router = express.Router();

// GET /api/summary/spending
// Returns: { userId, period (default: 30), totalExpenses, byCategory }
router.get('/spending', async (req, res) => {
    try {
        const userId = req.user.id;
        const days = parseInt(req.query.days, 10) || 30;

        const now = new Date();
        const toDate = now;
        const fromDate = new Date(now);
        fromDate.setDate(now.getDate() - days);

        const txs = await Transaction.find({
            userId,
            type: 'expense',
            date: { $gte: fromDate, $lte: toDate },
        });

        if (txs.length === 0) {
            return res.json({
                userId,
                period: {
                    from: fromDate.toISOString(),
                    to: toDate.toISOString(),
                    days,
                },
                totalExpenses: 0,
                byCategory: [],
            });
        }

        let total = 0;
        const byCategoryMap = {};

        for (const tx of txs) {
            const cat = tx.category || 'Uncategorised';
            byCategoryMap[cat] = (byCategoryMap[cat] || 0) + tx.amount;
            total += tx.amount;
        }

        // byCategory: { category, amount, percentage }
        const byCategory = Object.entries(byCategoryMap).map(([category, amount]) => {
            const percentage = total > 0 ? (amount / total) * 100 : 0;
            return {
                category,
                amount,
                percentage: Number(percentage.toFixed(1)),
            };
        });

        byCategory.sort((a, b) => b.amount - a.amount);

        res.json({
            userId,
            period: {
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
                days,
            },
            totalExpenses: Number(total.toFixed(2)),
            byCategory,
        });
    } catch (err) {
        console.error('Error generating spending summary.', err);
        res.status(500).json({ error: 'Failed to generate spending summary.' });
    }
});

module.exports = router;