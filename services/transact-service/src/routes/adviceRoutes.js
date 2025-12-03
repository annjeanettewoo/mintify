const express = require('express');
const Transaction = require('../models/Transaction');
const { getSpendingAdvice } = require('../aiClient');

const router = express.Router();

// GET /api/advice/spending
// Generate AI tips based on user spending over the last N (default: 30) days
router.get('/spending', async (req, res) => {
    try {
        const userId = req.user.id;
        const days = parseInt(req.query.days, 10) || 30;

        const now = new Date();
        const fromDate = new Date(now);
        fromDate.setDate(now.getDate() - days);

        const exps = await Transaction.find({
            userId,
            type: 'expense',
            date: { $gte: fromDate, $lte: now },
        }).sort({ date: -1 });

        if (exps.length === 0) {
            return res.json({
                summary: `No expenses found in the last ${days} days.`,
                advice: 'You have no recorded expenses for this period, so there is nothing to analyse yet.',
            });
        }

        const byCategory = {};
        let total = 0;

        for (const exp of exps) {
            const cat = exp.category || 'Uncategorised';
            byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
            total += exp.amount;
        }

        const summaryLines = [`UserId: ${userId}`, `Period: last ${days} days`, `Total expenses: ${total.toFixed(2)}`, '', 'By category:'];

        for (const [cat, amount] of Object.entries(byCategory)) {
            const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';
            summaryLines.push(`- ${cat}: ${amount.toFixed(2)} (${pct}%)`);
        }

        const summaryText = summaryLines.join('\n');

        const advice = await getSpendingAdvice(summaryText);

        res.json({
            summary: summaryText,
            advice,
        });
    } catch (err) {
        console.error('Error generating spending advice.', err);
        res.status(500).json({ error: 'Failed to generate spending advice.' });
    }
});

module.exports = router;
