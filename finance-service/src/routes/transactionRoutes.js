const express = require('express');
const router = express.Router();

// in-memory store for transactions *temp*
let transactions = [];
let nextId = 1;

/**
 * transaction shape {
 *   id: int,
 *   type: 'expense' | 'income',
 *   amount: float,
 *   category: string,
 *   date: string (ISO),
 *   description: string (optional)
 * }
 */

// GET /api/transactions
router.get('/', (req, res) => {
    res.json(transactions);
});

// GET /api/transactions/:id
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const txn = transactions.find((t) => t.id === id);

    if (!txn){
        return res.status(404).json({
            error: 'Transaction not found.'
        });
    }

    res.json(txn);
});

// POST /api/transactions  -> create transaction (expense or income)
router.post('/', (req, res) => {
    const {type, amount, category, date, description} = req.body;

    if (!type || (type !== 'expense' && type !== 'income')){
        return res.status(400).json({
            error: "type is required and must be 'expense' or 'income'."
        });
    }

    if (typeof amount !== 'number' || amount <= 0){
        return res.status(400).json({
            error: 'amount must be a positive number.'
        });
    }

    if (!category){
        return res.status(400).json({
            error: 'category is required.'
        });
    }

    const txnDate = date || new Date().toISOString();

    const newTxn = {
        id: nextId++,
        type,
        amount,
        category,
        date: txnDate,
        description: description || '',
    };

    transactions.push(newTxn);

    res.status(201).json(newTxn);
});

// PUT /api/transactions/:id
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const txn = transactions.find((t) => t.id === id);

    if (!txn){
        return res.status(404).json({
            error: 'Transaction not found.'
        });
    }

    const {type, amount, category, date, description} = req.body;

    if (!type || (type !== 'expense' && type !== 'income')){
        return res.status(400).json({
            error: "type is required and must be 'expense' or 'income'."
        });
    }

    if (typeof amount !== 'number' || amount <= 0){
        return res.status(400).json({
            error: 'amount must be a positive number.'
        });
    }

    if (!category){
        return res.status(400).json({
            error: 'category is required.'
        });
    }

    const txnDate = date || new Date().toISOString();

    txn.type = type;
    txn.amount = amount;
    txn.category = category;
    txn.date = txnDate;
    txn.description = description || '';

    res.json(txn);
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = transactions.findIndex((t) => t.id === id);

    if (index === -1) {
        return res.status(404).json({
            error: 'Transaction not found.'
        });
    }

    transactions.splice(index, 1);
    res.status(204).send();
});

module.exports = router;