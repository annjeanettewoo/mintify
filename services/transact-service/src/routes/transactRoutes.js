const express = require('express');
const Transaction = require('../models/Transaction');
const { publishSpendingRecorded } = require('../rabbit');

const router = express.Router();

// GET /api/transactions
// List transactions for current user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, category, from, to } = req.query;

        const filter = { userId };

        if (type) {
            filter.type = type;
        }
        if (category) {
            filter.category = category;
        }
        if (from || to) {
            filter.date = {};
            if (from) {
                filter.date.$gte = new Date(from);
            }
            if (to) {
                filter.date.$lte = new Date(to);
            }
        }

        const transactions = await Transaction.find(filter).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        console.error('Error fetching transactRoutes.', err);
        res.status(500).json({ error: 'Failed to fetch transactRoutes.' });
    }
});


// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const tx = await Transaction.findOne({ _id: id, userId });
        if (!tx) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }

        res.json(tx);
    } catch (err) {
        console.error('Error fetching transaction.', err);
        res.status(500).json({ error: 'Failed to fetch transaction.' });
    }
});

// POST /api/transactions
// Body: { type, amount, category, date, description, source }
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, amount, category, date, description, source } = req.body;

        if (!type || !['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'type must be income or expense.' });
        }
        if (typeof amount !== 'number') {
            return res.status(400).json({ error: 'amount must be a number.' });
        }
        if (!category) {
            return res.status(400).json({ error: 'category is required.' });
        }
        if (!date) {
            return res.status(400).json({ error: 'date is required.' });
        }

        const tx = new Transaction({
            userId,
            type,
            amount,
            category,
            date: new Date(date),
            description: description || '',
            source: source || 'manual',
        });

        await tx.save();

        // Only publish events for expenses
        if (tx.type === 'expense') {
            const event = {
                type: 'SPENDING_RECORDED',
                transactionId: tx._id.toString(),
                userId: tx.userId,
                amount: tx.amount,
                category: tx.category,
                date: tx.date,
                occurredAt: new Date().toISOString(),
            };

            // Fire and forget - do not block response on event success
            publishSpendingRecorded(event);
        }

        res.status(201).json(tx);

    } catch (err) {
        console.error('Error creating transaction.', err);
        res.status(500).json({ error: 'Failed to create transaction.' });
    }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { type, amount, category, date, description, source } = req.body;

        const update = {};
        if (type !== undefined) update.type = type;
        if (amount !== undefined) update.amount = amount;
        if (category !== undefined) update.category = category;
        if (date !== undefined) update.date = new Date(date);
        if (description !== undefined) update.description = description;
        if (source !== undefined) update.source = source;

        const tx = await Transaction.findOneAndUpdate(
            { _id: id, userId },
            { $set: update },
            { new: true }
        );

        if (!tx) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }

        res.json(tx);
    } catch (err) {
        console.error('Error updating transaction.', err);
        res.status(500).json({ error: 'Failed to update transaction.' });
    }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await Transaction.findOneAndDelete({ _id: id, userId });
        if (!result) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting transaction.', err);
        res.status(500).json({ error: 'Failed to delete transaction.' });
    }
});

module.exports = router;
