const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin } = require('../../models');
const { getRequiredSecret } = require('../../config/security');

const getLogin = (req, res) => {
  return res.render('login', { error: null });
};

const postLogin = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const admin = await Admin.findOne({ where: { email } });

    if (!admin || admin.status !== 1) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account is suspended.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: admin.id, type: 'admin', role: admin.role }, getRequiredSecret('JWT_SECRET'), { expiresIn: '8h' });
    return res.json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again.' });
  }
};

const logout = (_req, res) => res.json({ success: true });

module.exports = {
  getLogin,
  postLogin,
  logout
};
