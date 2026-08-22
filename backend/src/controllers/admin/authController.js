const bcrypt = require('bcrypt');
const { Admin } = require('../../models');

const getLogin = (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  return res.render('login', { error: null });
};

const postLogin = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.render('login', { error: 'Please enter both email and password.' });
    }

    const admin = await Admin.findOne({ where: { email } });

    if (!admin || admin.status !== 1) {
      return res.render('login', { error: 'Invalid credentials or account is suspended.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid credentials.' });
    }

    // Set session
    req.session.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    return req.session.save((sessionError) => {
      if (sessionError) {
        console.error('Admin session save error:', sessionError);
        return res.render('login', { error: 'Unable to start your session. Please try again.' });
      }
      return res.redirect('/admin/dashboard');
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.render('login', { error: 'An unexpected error occurred. Please try again.' });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    return res.redirect('/admin/login');
  });
};

module.exports = {
  getLogin,
  postLogin,
  logout
};
