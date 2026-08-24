const bcrypt = require('bcrypt');
const { getRequiredSecret } = require('../../config/security');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { User, SubscriptionPlan } = require('../../models');
const { buildIndianE164, sendPasswordResetCode, checkPasswordResetCode } = require('../../services/passwordResetService');

const setAuthCookie = (res, token) => {
  res.cookie('live_darshan_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
};

const findUserByMobile = async (value) => {
  const phone = buildIndianE164(value);
  if (!phone) return null;
  const mobile = phone.slice(-10);
  return User.findOne({ where: { phone: { [Op.in]: [mobile, phone, `91${mobile}`] } } });
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { full_name, phone, password, referral_code } = req.body;

    // Fetch default plan (Free plan with plan_id = 1 or plan_name = 'Free')
    const freePlan = await SubscriptionPlan.findOne({ where: { plan_name: 'Free' } });
    const planId = freePlan ? freePlan.id : 1;
    const durationDays = freePlan ? freePlan.duration_days : 3650;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const hashedPassword = await bcrypt.hash(password, 10);

    // A referral can be supplied as the user's code or their existing mobile number.
    // We accept common Indian number formats without exposing whether a number exists.
    let referredById = null;
    if (referral_code) {
      const referralValue = referral_code.trim();
      let referrer = await User.findOne({ where: { referral_code: referralValue } });

      if (!referrer) {
        const digits = referralValue.replace(/\D/g, '');
        const mobile = digits.length >= 10 ? digits.slice(-10) : '';
        if (mobile.length === 10) {
          referrer = await User.findOne({
            where: {
              phone: {
                [Op.in]: [mobile, `+91${mobile}`, `91${mobile}`]
              }
            }
          });
        }
      }

      if (!referrer) {
        return res.status(400).json({ success: false, message: 'Referral code or mobile number was not found.' });
      }
      referredById = referrer.id;
    }

    // Generate unique referral code for the new user
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneSuffix = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : cleanPhone;
    const ownReferralCode = `REF${phoneSuffix}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newUser = await User.create({
      full_name,
      phone,
      password: hashedPassword,
      plan_id: planId,
      subscription_expiry: expiryDate,
      status: 'active',
      referral_code: ownReferralCode,
      referred_by: referredById,
      wallet_balance: 0.00,
      last_login: new Date()
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id },
      getRequiredSecret('JWT_SECRET'),
      { expiresIn: '7d' }
    );
    setAuthCookie(res, token);

    // Exclude password from output
    const userOutput = newUser.toJSON();
    delete userOutput.password;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userOutput
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, password } = req.body;

    const user = await User.findOne({
      where: { phone },
      include: [{ model: SubscriptionPlan, as: 'Plan' }]
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user.id },
      getRequiredSecret('JWT_SECRET'),
      { expiresIn: '7d' }
    );
    setAuthCookie(res, token);

    const userOutput = user.toJSON();
    delete userOutput.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userOutput
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const logout = (req, res) => {
  res.clearCookie('live_darshan_auth', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

const profile = async (req, res) => {
  try {
    const user = req.user;
    if (!user.referral_code) {
      const cleanPhone = user.phone.replace(/\D/g, '');
      const phoneSuffix = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : cleanPhone;
      user.referral_code = `REF${phoneSuffix}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await user.save();
    }

    const userOutput = user.toJSON();
    delete userOutput.password;

    return res.status(200).json({
      success: true,
      user: userOutput
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const phone = buildIndianE164(req.body.phone);
    if (!phone) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });

    const user = await findUserByMobile(phone);
    // Do not reveal whether this mobile number is registered.
    if (!user || user.status === 'blocked') {
      return res.status(200).json({ success: true, message: 'If this mobile number is registered, a reset code has been sent.' });
    }

    await sendPasswordResetCode(phone);
    return res.status(200).json({ success: true, message: 'A six-digit reset code has been sent by SMS.' });
  } catch (error) {
    console.error('requestPasswordReset error:', error.message);
    const status = error.code === 'SMS_NOT_CONFIGURED' ? 503 : 500;
    return res.status(status).json({ success: false, message: error.message || 'Unable to send the reset code. Please try again.' });
  }
};

const confirmPasswordReset = async (req, res) => {
  try {
    const { phone: rawPhone, code, password, confirm_password } = req.body;
    const phone = buildIndianE164(rawPhone);
    if (!phone) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    if (!/^\d{6}$/.test(String(code || ''))) return res.status(400).json({ success: false, message: 'Enter the six-digit SMS code.' });
    if (String(password || '').length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    if (password !== confirm_password) return res.status(400).json({ success: false, message: 'Passwords do not match.' });

    const user = await findUserByMobile(phone);
    if (!user || user.status === 'blocked') return res.status(400).json({ success: false, message: 'Unable to reset this password. Please contact support.' });

    const verification = await checkPasswordResetCode(phone, String(code));
    if (verification.status !== 'approved') return res.status(400).json({ success: false, message: 'The reset code is invalid or has expired. Request a new code.' });

    user.password = await bcrypt.hash(password, 10);
    user.password_changed_at = new Date();
    await user.save();
    return res.status(200).json({ success: true, message: 'Password changed successfully. Please sign in.' });
  } catch (error) {
    console.error('confirmPasswordReset error:', error.message);
    const status = error.code === 'SMS_NOT_CONFIGURED' ? 503 : 500;
    return res.status(status).json({ success: false, message: error.message || 'Unable to reset the password. Please try again.' });
  }
};

module.exports = {
  register,
  login,
  profile,
  logout,
  requestPasswordReset,
  confirmPasswordReset
};
