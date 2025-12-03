const express = require('express');
const router = express.Router();
const {publish} = require('../eventBus');
const {sendSpendingRecordedNotification} = require('../notifClient');

// in-memory store for transactions *temp*
let transactions = [];
let nextId = 1;

// in-memory store for spending events *temp*
let spendingEvents = [];
let nextEventId = 1;

// helper to publish spending events
function publishSpendingEvent(transaction){
    const event = {
        id: nextEventId++,
        type: 'SPENDING_RECORDED',
        transactionId: transaction.id,
        amount: transaction.amount,
        category: transaction.category,
        occurredAt: new Date().toISOString()
    };

    spendingEvents.push(event);

    // publish to event bus
    publish('SPENDING_RECORDED', event);

    console.log('Spending event published:', event);

    // notify notif-service (fire-and-forget)
    sendSpendingRecordedNotification({
        id: event.transactionId,
        amount: event.amount,
        category: event.category,
        date: event.occurredAt,
    });
}

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

// GET /api/transactions/events/spending
router.get('/events/spending', (req, res) => {
    res.json(spendingEvents);
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

// POST /api/transactions
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

    // publish spending event only for expenses
    if (newTxn.type === 'expense'){
        publishSpendingEvent(newTxn);
    }

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