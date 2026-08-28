const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../src/models', () => ({ Admin: { findOne: jest.fn() } }));

const { Admin } = require('../src/models');
const { postLogin } = require('../src/controllers/admin/authController');
const adminAuth = require('../src/middlewares/adminAuth');

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

  it('allows an authorised frontend origin even when the browser marks it cross-site', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousFrontendUrl = process.env.FRONTEND_URL;
    const previousJwtSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://devdarshanlive.com,https://www.devdarshanlive.com,https://api.devdarshanlive.com';
    process.env.JWT_SECRET = 'super_secret_jwt_key_123!@#';
    const token = jwt.sign({ id: 5, type: 'admin', role: 'super_admin' }, process.env.JWT_SECRET);
    Admin.findByPk = jest.fn().mockResolvedValue({ id: 5, name: 'Super Admin', email: 'admin@example.com', role: 'super_admin', status: 1 });
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn(), redirect: jest.fn(), locals: {} };
    const req = { get: jest.fn((header) => ({ origin: 'https://devdarshanlive.com', authorization: `Bearer ${token}`, 'sec-fetch-site': 'cross-site' }[header])) };
    const next = jest.fn();
    await adminAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = previousFrontendUrl;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  it('blocks a cross-site navigation without an allowlisted Origin', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn(), redirect: jest.fn(), locals: {} };
    const req = { get: jest.fn((header) => ({ 'sec-fetch-site': 'cross-site' }[header])) };
    const next = jest.fn();
    await adminAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });
});
