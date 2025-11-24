const express = require('express');
const router = express.Router();
const {subscribe} = require('../eventBus');

// in-memory store for budgets *temp*
let budgets = [];
let nextId = 1;

/**
 * budget shape {
 *     id: int,
 *     category: string,
 *     limit: float,
 *     spent: float
 * }
 */

// GET /api/budgets
router.get('/', (req, res) => {
    res.json(budgets);
});

// POST /api/budgets
router.post('/', (req, res) => {
    const {category, limit} = req.body;

    if (!category || typeof limit !== 'number'){
        return res.status(400).json({
            error: 'category and limit are required.'
        });
    }

    const newBudget = {
        id: nextId++,
        category,
        limit,
        spent: 0,
    };

    budgets.push(newBudget);
    res.status(201).json(newBudget);
});

// GET /api/budgets/:id
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    console.log('GET /api/budgets/:id', {id, budgets});
    const budget = budgets.find((b) => b && b.id === id);

    if (!budget){
        return res.status(404).json({
            error: 'Budget not found.'
        });
    }

    res.json(budget);
});

// PUT /api/budgets/:id
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const budget = budgets.find((b) => b.id === id);

    if (!budget){
        return res.status(404).json({
            error: 'Budget not found.'
        });
    }

    const {category, limit} = req.body;

    if (!category || typeof limit !== 'number'){
        return res.status(400).json({
            error: 'category and limit are required.'
        });
    }

    budget.category = category;
    budget.limit = limit;
    res.json(budget);
});

// DELETE /api/budgets/:id
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = budgets.findIndex((b) => b.id === id);

    if (index === -1){
        return res.status(404).json({
            error: 'Budget not found.'
        });
    }

    budgets.splice(index, 1);
    res.status(204).send();
});

// PATCH /api/budgets/:id/spent
router.patch('/:id/spent', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const {amount} = req.body;

    if (typeof amount !== 'number'){
        return res.status(400).json({
            error: 'amount is required.'
        });
    }

    const budget = budgets.find((b) => b.id === id);

    if (!budget){
        return res.status(404).json({
            error: 'Budget not found.'
        });
    }

    // allow positive and negative
    budget.spent += amount;

    const remaining = budget.limit - budget.spent;
    const status = budget.spent > budget.limit ? 'over-budget':'within-budget';
    res.json({...budget, remaining, status});
});

// subscribe budget service to spending events
subscribe('SPENDING_RECORDED', (event) => {
    const {category, amount} = event;

    // find budget for category
    const budget = budgets.find((b) => b.category === category);

    if (budget){
        budget.spent += amount;
        console.log(`Budget updated: category=${category}, amount added=${amount}`);
    } else {
        console.log(`No budget found for category=${category}.`);
    }
});

module.exports = router;