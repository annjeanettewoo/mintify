// tests/notif.api.test.js
const request = require('supertest');

// Mock Notification model BEFORE loading app
jest.mock('../src/models/Notification', () => {
  const NotificationMock = function (data) {
    Object.assign(this, data);
    this._id = this._id || 'notif-123';
    if (this.read === undefined) {
      this.read = false;
    }
    this.save = jest.fn().mockResolvedValue(this);
  };

  NotificationMock.find = jest.fn();
  NotificationMock.findOneAndUpdate = jest.fn();

  return NotificationMock;
});

const Notification = require('../src/models/Notification');
const { createApp } = require('../src/app');

describe('notif-service API', () => {
  let app;
  let broadcastNotification;

  beforeEach(() => {
    jest.clearAllMocks();
    broadcastNotification = jest.fn();
    app = createApp({ broadcastNotification });
  });

  //
  // GET /api/notifications
  //
  it('GET /api/notifications returns notifications for current user', async () => {
    const fakeNotifs = [
      {
        _id: 'n1',
        userId: 'user-123',
        title: 'Test 1',
        message: 'Hello',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'n2',
        userId: 'user-123',
        title: 'Test 2',
        message: 'World',
        type: 'info',
        read: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const limitMock = jest.fn().mockResolvedValue(fakeNotifs);
    const sortMock = jest.fn(() => ({ limit: limitMock }));

    Notification.find.mockReturnValueOnce({
      sort: sortMock,
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('x-user-id', 'user-123');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(Notification.find).toHaveBeenCalledWith({ userId: 'user-123' });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(limitMock).toHaveBeenCalledWith(100);
  });

  it('GET /api/notifications?unread=true filters unread', async () => {
    const limitMock = jest.fn().mockResolvedValue([]);
    const sortMock = jest.fn(() => ({ limit: limitMock }));

    Notification.find.mockReturnValueOnce({
      sort: sortMock,
    });

    const res = await request(app)
      .get('/api/notifications?unread=true')
      .set('x-user-id', 'user-123');

    expect(res.status).toBe(200);
    expect(Notification.find).toHaveBeenCalledWith({
      userId: 'user-123',
      read: false,
    });
  });

  it('GET /api/notifications returns 500 when DB fails', async () => {
    const limitMock = jest.fn().mockRejectedValue(new Error('DB down'));
    const sortMock = jest.fn(() => ({ limit: limitMock }));

    Notification.find.mockReturnValueOnce({
      sort: sortMock,
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('x-user-id', 'user-123');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Failed to fetch notifRoutes/i);
  });

  //
  // PUT /api/notifications/:id/read
  //
  it('PUT /api/notifications/:id/read marks notification read', async () => {
    const updated = {
      _id: 'n1',
      userId: 'demo-user',
      title: 'Hi',
      message: 'Msg',
      type: 'info',
      read: true,
    };

    Notification.findOneAndUpdate.mockResolvedValueOnce(updated);

    const res = await request(app)
      .put('/api/notifications/n1/read')
      .set('x-user-id', 'demo-user');

    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
    expect(Notification.findOneAndUpdate).toHaveBeenCalled();
    expect(Notification.findOneAndUpdate.mock.calls[0][0]).toMatchObject({
        _id: 'n1',
        userId: 'demo-user',
    });
  });

  it('PUT /api/notifications/:id/read returns 404 when not found', async () => {
    Notification.findOneAndUpdate.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/notifications/missing/read')
      .set('x-user-id', 'demo-user');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Notification not found/i);
  });

  //
  // POST /notify
  //
  it('POST /notify creates notification and broadcasts', async () => {
    const res = await request(app).post('/notify').send({
      userId: 'user-1',
      title: 'Hello',
      message: 'World',
      type: 'info',
    });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe('user-1');
    expect(res.body.title).toBe('Hello');
    expect(res.body.message).toBe('World');

    expect(broadcastNotification).toHaveBeenCalledTimes(1);
    const arg = broadcastNotification.mock.calls[0][0];
    expect(arg.userId).toBe('user-1');
    expect(arg.title).toBe('Hello');
  });

  it('POST /notify returns 400 when required fields missing', async () => {
    const res = await request(app).post('/notify').send({
      // missing userId/title/message
      type: 'info',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId, title and message are required/i);
    expect(broadcastNotification).not.toHaveBeenCalled();
  });
});
