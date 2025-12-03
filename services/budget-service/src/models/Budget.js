const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        category: {
            type: String,
            required: true,
        },
        limit: {
            type: Number,
            required: true,
            min: 0,
        },
        spent: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        period: {
            type: String,
            default: null,
        },
    },
    { timestamps: true } // createdAt, updatedAt
);

BudgetSchema.index({ userId: 1, category: 1, period: 1 });

const Budget = mongoose.model('Budget', BudgetSchema);

module.exports = Budget;
