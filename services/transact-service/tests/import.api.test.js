const request = require('supertest');
const { createApp } = require('../src/app');

// Mock Transaction model BEFORE loading routes
jest.mock('../src/models/Transaction', () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);

    function Transaction(doc) {
        Object.assign(this, doc);
        this.save = saveMock;
        this._id = {
            toString: () => 'mock-id',
        };
    }

    Transaction.find = jest.fn(() => ({
        sort: jest.fn().mockResolvedValue([]),
    }));
    Transaction.insertMany = jest.fn();
    Transaction.__saveMock = saveMock;

    return Transaction;
});

const Transaction = require('../src/models/Transaction');

// Mock RabbitMQ publisher
jest.mock('../src/rabbit', () => ({
    publishSpendingRecorded: jest.fn(),
}));

const { publishSpendingRecorded } = require('../src/rabbit');

describe('transact-service /api/transactions/import', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = createApp();
    });

    test('POST /api/transactions/import imports rows and publishes event only for expenses', async () => {
        // Arrange: CSV with 1 expense + 1 income
        const csv = [
            'date,type,amount,category,description',
            '2024-01-01,expense,40,Food,Supper',
            '2024-01-02,income,2000,Salary,Paycheck',
        ].join('\n');

        // Mock insertMany return (what your route uses after parsing)
        Transaction.insertMany.mockResolvedValue([
            {
                _id: { toString: () => 'tx-expense-1' },
                userId: 'user-123',
                type: 'expense',
                amount: 40,
                category: 'Food',
                date: new Date('2024-01-01'),
                description: 'Supper',
            },
            {
                _id: { toString: () => 'tx-income-1' },
                userId: 'user-123',
                type: 'income',
                amount: 2000,
                category: 'Salary',
                date: new Date('2024-01-02'),
                description: 'Paycheck',
            },
        ]);

        // Act
        const res = await request(app)
            .post('/api/transactions/import')
            .set('x-user-id', 'user-123')
            .attach('file', Buffer.from(csv), 'import.csv');

        // Assert
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            importedCount: 2,
        });

        expect(Transaction.insertMany).toHaveBeenCalledTimes(1);

        // Only the expense row should publish
        expect(publishSpendingRecorded).toHaveBeenCalledTimes(1);
        const eventArg = publishSpendingRecorded.mock.calls[0][0];

        expect(eventArg).toMatchObject({
            type: 'SPENDING_RECORDED',
            userId: 'user-123',
            amount: 40,
            category: 'Food',
        });
    });
});
