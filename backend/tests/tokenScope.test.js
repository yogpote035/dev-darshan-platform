const jwt = require('jsonwebtoken');

jest.mock('../src/models', () => ({ User: { findByPk: jest.fn() }, SubscriptionPlan: {} }));

const authMiddleware = require('../src/middlewares/authMiddleware');
const { User } = require('../src/models');

const responseDouble = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

it('does not allow an admin token to call a user API', async () => {
  const adminToken = jwt.sign({ id: 1, type: 'admin', role: 'super_admin' }, process.env.JWT_SECRET || 'super_secret_jwt_key_123!@#');
  const res = responseDouble();
  const next = jest.fn();
  await authMiddleware({ headers: { authorization: `Bearer ${adminToken}` } }, res, next);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(User.findByPk).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
});
