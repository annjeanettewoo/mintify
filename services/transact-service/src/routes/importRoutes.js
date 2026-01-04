const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse');
const Transaction = require('../models/Transaction');
const { publishSpendingRecorded } = require('../rabbit');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

function parseCsv(buffer) {
    return new Promise((resolve, reject) => {
        const records = [];
        const parser = parse(
            {
                columns: true,
                trim: true,
                skip_empty_lines: true,
            },
            (err, output) => {
                if (err) {
                    return reject(err);
                }
                resolve(output);
            }
        );

        parser.write(buffer);
        parser.end();
    });
}

// POST /api/transactions/import
// CSV file: { date, type, amount, category, description }
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'CSV file is required.' });
        }

        const buffer = req.file.buffer;
        const rows = await parseCsv(buffer);

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or invalid.' });
        }

        const docs = [];

        for (const row of rows) {
            const type = row.type?.toLowerCase();
            const amount = parseFloat(row.amount);
            const category = row.category || 'Uncategorised';
            const dateStr = row.date;
            const description = row.description || '';

            if (!dateStr || Number.isNaN(new Date(dateStr).getTime())) {
                console.warn('Skipping row with invalid date:', row);
                continue;
            }
            if (!['income', 'expense'].includes(type)) {
                console.warn('Skipping row with invalid type:', row);
                continue;
            }
            if (Number.isNaN(amount) || amount <= 0) {
                console.warn('Skipping row with invalid amount:', row);
                continue;
            }

            docs.push({
                userId,
                type,
                amount,
                category,
                date: new Date(dateStr),
                description,
                source: 'csv',
            });
        }

        if (docs.length === 0) {
            return res.status(400).json({ error: 'No valid rows found in CSV.' });
        }

        const created = await Transaction.insertMany(docs);
        
        // Fire RabbitMQ events for each expense transaction
        for (const tx of created) {
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

                publishSpendingRecorded(event);
            }
        }

        res.status(201).json({
            importedCount: created.length,
        });
        
    } catch (err) {
        console.error('Error importing transactions from CSV.', err);
        res.status(500).json({ error: 'Failed to import transactions.' });
    }
});

module.exports = router;
