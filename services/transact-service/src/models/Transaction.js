const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
        source: {
            type: String,
            default: 'manual', // 'manual' or 'csv'
        },
    },
    { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
