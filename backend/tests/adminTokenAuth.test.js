const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../src/models', () => ({ Admin: { findOne: jest.fn() } }));

const { Admin } = require('../src/models');
const { postLogin } = require('../src/controllers/admin/authController');

const responseDouble = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Admin token authentication', () => {
  it('returns a scoped JWT and does not create a session or cookie', async () => {
    Admin.findOne.mockResolvedValue({ id: 5, name: 'Super Admin', email: 'admin@example.com', role: 'super_admin', status: 1, password: await bcrypt.hash('Password@123', 10) });
    const res = responseDouble();
    await postLogin({ body: { email: 'ADMIN@EXAMPLE.COM', password: 'Password@123' } }, res);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(jwt.verify(payload.token, process.env.JWT_SECRET || 'super_secret_jwt_key_123!@#')).toEqual(expect.objectContaining({ id: 5, type: 'admin', role: 'super_admin' }));
  });
});
