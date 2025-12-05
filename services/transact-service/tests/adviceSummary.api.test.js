// tests/adviceSummary.api.test.js
const request = require('supertest');
const { createApp } = require('../src/app');

jest.mock('../src/models/Transaction', () => {
  const Model = {};
  Model.find = jest.fn();
  return Model;
});

const Transaction = require('../src/models/Transaction');

jest.mock('../src/aiClient', () => ({
  getSpendingAdvice: jest.fn(),
}));

const { getSpendingAdvice } = require('../src/aiClient');

describe('transact-service advice & summary routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  // -------------------------------
  // ADVICE ROUTE TEST
  // -------------------------------
  test('GET /api/advice/spending returns default message when no expenses', async () => {
    // Transaction.find(...).sort(...)
    Transaction.find.mockReturnValueOnce({
      sort: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app).get('/api/advice/spending?days=7');

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatch(/No expenses found in the last 7 days/i);
    expect(res.body.advice).toMatch(/nothing to analyse/i);
    expect(getSpendingAdvice).not.toHaveBeenCalled();
  });

  // -------------------------------
  // SUMMARY ROUTE TEST
  // -------------------------------
  test('GET /api/summary/spending aggregates by category', async () => {
    const now = new Date('2024-01-31T12:00:00Z');
    const txs = [
      {
        userId: 'demo-user',
        type: 'expense',
        amount: 10,
        category: 'Food',
        date: now,
      },
      {
        userId: 'demo-user',
        type: 'expense',
        amount: 20,
        category: 'Transport',
        date: now,
      },
      {
        userId: 'demo-user',
        type: 'expense',
        amount: 10,
        category: 'Food',
        date: now,
      },
    ];

    Transaction.find.mockResolvedValueOnce(txs);

    const res = await request(app).get('/api/summary/spending?days=30');

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('demo-user');
    expect(res.body.totalExpenses).toBe(40);

    // Order-agnostic match: categories may appear in either order
    expect(res.body.byCategory).toEqual(
      expect.arrayContaining([
        { category: 'Transport', amount: 20, percentage: 50 },
        { category: 'Food', amount: 20, percentage: 50 },
      ])
    );

    // Ensure exactly 2 categories exist
    expect(res.body.byCategory).toHaveLength(2);
  });

  // -------------------------------
  // DB FAILURE TEST
  // -------------------------------
  test('GET /api/summary/spending returns 500 when DB fails', async () => {
    Transaction.find.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).get('/api/summary/spending');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Failed to generate spending summary/i);
  });
});
