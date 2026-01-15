const express = require('express');
const Budget = require('../models/Budget');

const router = express.Router();

// GET /api/budgets
// List all budgets for current user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });
        res.json(budgets);
    } catch (err) {
        console.error('Error fetching budgetRoutes.', err);
        res.status(500).json({ error: 'Failed to fetch budgetRoutes.' });
    }
});

// POST /api/budgets
// Body: { category, limit, period }
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, limit, spent, period } = req.body;

        if (!category || typeof limit !== 'number') {
            return res
                .status(400)
                .json({ error: 'category and numeric limit are required.' });
        }

        const budget = new Budget({
            userId,
            category,
            limit,
            spent: spent || 0,
            period: period || null
        });

        await budget.save();
        res.status(201).json(budget);
    } catch (err) {
        console.error('Error creating budget.', err);

        if (err.code === 11000) {
            return res.status(409).json({
                error: 'Budget for this category and period already exists.'
            });
        }

        res.status(500).json({ error: 'Failed to create budget.' });
    }
});

// PUT /api/budgets/:id
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { category, limit, spent, period } = req.body;

        const update = {};
        if (category !== undefined) update.category = category;
        if (limit !== undefined) update.limit = limit;
        if (spent !== undefined) update.spent = spent;
        if (period !== undefined) update.period = period;

        const budget = await Budget.findOneAndUpdate(
            { _id: id, userId },
            { $set: update },
            { new: true }
        );

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found.' });
        }

        res.json(budget);
    } catch (err) {
        console.error('Error updating budget.', err);
        res.status(500).json({ error: 'Failed to update budget.' });
    }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await Budget.findOneAndDelete({ _id: id, userId });

        if (!result) {
            return res.status(404).json({ error: 'Budget not found.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting budget.', err);
        res.status(500).json({ error: 'Failed to delete budget.' });
    }
});

module.exports = router;
