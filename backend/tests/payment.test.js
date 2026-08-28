const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

jest.mock('../src/models', () => ({
  User: { findByPk: jest.fn() },
  SubscriptionPlan: { findByPk: jest.fn() },
  Subscription: { create: jest.fn() },
  Payment: { create: jest.fn(), findOne: jest.fn() },
  Setting: { findOne: jest.fn() },
  Commission: { create: jest.fn() },
  sequelize: { authenticate: jest.fn().mockResolvedValue(), sync: jest.fn().mockResolvedValue() }
}));

const { User, Setting } = require('../src/models');

describe('Legacy one-time membership payment routes', () => {
  const token = jwt.sign(
    { id: 42, type: 'user' },
    process.env.JWT_SECRET || 'super_secret_jwt_key_123!@#',
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    User.findByPk.mockResolvedValue({ id: 42, status: 'active' });
    Setting.findOne.mockResolvedValue({ free_user_ads_enabled: 1 });
  });

  it.each(['/create-order', '/verify', '/recover'])('rejects %s so paid membership cannot bypass mandatory Autopay', async (path) => {
    const response = await request(app)
      .post(`/api/payments${path}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ plan_id: 3 });

    expect(response.status).toBe(410);
    expect(response.body).toEqual(expect.objectContaining({
      success: false,
      message: expect.stringMatching(/Autopay/i)
    }));
  });
});
