// tests/transactions.api.test.js
const request = require('supertest');
const { createApp } = require('../src/app');

// Mock Transaction model
jest.mock('../src/models/Transaction', () => {
  const saveMock = jest.fn().mockResolvedValue(undefined);

  function Transaction(doc) {
    Object.assign(this, doc);
    this.save = saveMock;
    // Add this so tx._id.toString() doesn't crash
    this._id = {
      toString: () => 'mock-id',
    };
  }

  Transaction.find = jest.fn(() => ({
    sort: jest.fn().mockResolvedValue([]),
  }));
  Transaction.findOne = jest.fn();
  Transaction.findOneAndUpdate = jest.fn();
  Transaction.findOneAndDelete = jest.fn();
  Transaction.__saveMock = saveMock;

  return Transaction;
});

const Transaction = require('../src/models/Transaction');

// Mock RabbitMQ publisher
jest.mock('../src/rabbit', () => ({
  publishSpendingRecorded: jest.fn(),
}));

const { publishSpendingRecorded } = require('../src/rabbit');

describe('transact-service /api/transactions', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'transact-service',
    });
  });

  test('POST /api/transactions rejects invalid type', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({
        type: 'weird',
        amount: 10,
        category: 'Food',
        date: '2024-01-01',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/type must be income or expense/i);
    // no DB write
    expect(Transaction.__saveMock).not.toHaveBeenCalled();
  });

  test('POST /api/transactions creates expense and publishes event', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('x-user-id', 'user-123')
      .send({
        type: 'expense',
        amount: 25.5,
        category: 'Food',
        date: '2024-01-01',
        description: 'Lunch',
      });

    expect(res.status).toBe(201);
    expect(Transaction.__saveMock).toHaveBeenCalledTimes(1);

    // Event should be fired for expense
    expect(publishSpendingRecorded).toHaveBeenCalledTimes(1);
    const eventArg = publishSpendingRecorded.mock.calls[0][0];

    expect(eventArg).toMatchObject({
      type: 'SPENDING_RECORDED',
      userId: 'user-123',
      amount: 25.5,
      category: 'Food',
    });
  });

  test('GET /api/transactions builds correct filter', async () => {
    const mockSort = jest.fn().mockResolvedValue([]);
    Transaction.find.mockImplementationOnce((filter) => {
      // store the filter so we can assert later
      Transaction.__lastFilter = filter;
      return { sort: mockSort };
    });

    const res = await request(app).get(
      '/api/transactions?type=expense&category=Food&from=2024-01-01&to=2024-01-31'
    );

    expect(res.status).toBe(200);
    expect(Transaction.__lastFilter).toEqual({
      userId: 'demo-user', // from tempUser middleware default
      type: 'expense',
      category: 'Food',
      date: {
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-01-31'),
      },
    });
    expect(mockSort).toHaveBeenCalledWith({ date: -1 });
  });

  test('GET /api/transactions returns 500 when DB throws', async () => {
    Transaction.find.mockImplementationOnce(() => {
      throw new Error('DB down');
    });

    const res = await request(app).get('/api/transactions');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Failed to fetch transactRoutes/i);
  });
});
