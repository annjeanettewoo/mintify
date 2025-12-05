// tests/budgets.api.test.js
const request = require('supertest');

// IMPORTANT: mock Budget model BEFORE loading app (so routes use the mock)
jest.mock('../src/models/Budget', () => {
  // shared save mock so tests can manipulate it
  const saveMock = jest.fn().mockResolvedValue(undefined);

  const BudgetMock = function (data) {
    // instance: used for POST (new Budget(...).save())
    Object.assign(this, data);
    this._id = this._id || 'budget-id-123';
    this.save = saveMock;
  };

  // static methods used by routes
  BudgetMock.find = jest.fn();
  BudgetMock.findOneAndUpdate = jest.fn();
  BudgetMock.findOneAndDelete = jest.fn();

  // expose save mock so tests can force errors
  BudgetMock.__saveMock = saveMock;

  return BudgetMock;
});

const { app } = require('../src/app');
const Budget = require('../src/models/Budget');

describe('Budget API', () => {
  beforeEach(() => {
    // reset mock calls/state before each test
    Budget.find.mockReset();
    Budget.findOneAndUpdate.mockReset();
    Budget.findOneAndDelete.mockReset();
    Budget.__saveMock.mockReset();
    Budget.__saveMock.mockResolvedValue(undefined);
  });

  //
  // GET /api/budgets
  //
  it('GET /api/budgets returns budgets for the current user', async () => {
    const fakeBudgets = [
      {
        _id: 'b1',
        userId: 'user-123',
        category: 'Food',
        limit: 200,
        spent: 50,
        period: '2024-11',
      },
      {
        _id: 'b2',
        userId: 'user-123',
        category: 'Transport',
        limit: 100,
        spent: 20,
        period: null,
      },
    ];

    Budget.find.mockReturnValueOnce({
      sort: jest.fn().mockResolvedValue(fakeBudgets),
    });

    const res = await request(app)
      .get('/api/budgets')
      .set('x-user-id', 'user-123');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(Budget.find).toHaveBeenCalledWith({ userId: 'user-123' });
  });

  it('GET /api/budgets returns 500 when database fails', async () => {
    Budget.find.mockReturnValueOnce({
      sort: jest.fn().mockRejectedValue(new Error('DB down')),
    });

    const res = await request(app)
      .get('/api/budgets')
      .set('x-user-id', 'user-123');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to fetch budgetRoutes.');
  });

  //
  // POST /api/budgets
  //
  it('POST /api/budgets creates a new budget when body is valid', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set('x-user-id', 'demo-user')
      .send({
        category: 'Food',
        limit: 300,
        period: '2024-11',
      });

    expect(res.status).toBe(201);
    // Returned body is whatever our mock instance looks like
    expect(res.body.category).toBe('Food');
    expect(res.body.limit).toBe(300);
    expect(res.body.userId).toBe('demo-user'); // set in route
  });

  it('POST /api/budgets returns 400 when category or numeric limit is missing', async () => {
    // invalid: limit is string, not number
    const res = await request(app)
      .post('/api/budgets')
      .set('x-user-id', 'demo-user')
      .send({
        category: 'Food',
        limit: 'not-a-number',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      'error',
      'category and numeric limit are required.'
    );
  });

  it('POST /api/budgets returns 500 when save() fails', async () => {
    // Force the shared save mock to reject once
    Budget.__saveMock.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app)
      .post('/api/budgets')
      .set('x-user-id', 'demo-user')
      .send({
        category: 'Food',
        limit: 300,
        period: '2024-11',
      });

    expect(Budget.__saveMock).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error'); // adjust message if your route uses a specific string
  });

  //
  // PUT /api/budgets/:id
  //
  it('PUT /api/budgets/:id returns 404 when budget not found', async () => {
    Budget.findOneAndUpdate.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/budgets/nonexistent-id')
      .set('x-user-id', 'demo-user')
      .send({
        limit: 999,
      });

    expect(Budget.findOneAndUpdate).toHaveBeenCalled();
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Budget not found.');
  });

  //
  // DELETE /api/budgets/:id
  //
  it('DELETE /api/budgets/:id returns 200 when budget is deleted', async () => {
    Budget.findOneAndDelete.mockResolvedValueOnce({
      _id: 'to-delete',
      userId: 'demo-user',
      category: 'Food',
      limit: 100,
      spent: 10,
    });

    const res = await request(app)
      .delete('/api/budgets/to-delete')
      .set('x-user-id', 'demo-user');

    expect(Budget.findOneAndDelete).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('DELETE /api/budgets/:id returns 404 when budget does not exist', async () => {
    Budget.findOneAndDelete.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete('/api/budgets/missing-id')
      .set('x-user-id', 'demo-user');

    expect(Budget.findOneAndDelete).toHaveBeenCalled();
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Budget not found.');
  });
});
