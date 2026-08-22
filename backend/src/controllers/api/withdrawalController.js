const { Withdrawal, User, Commission } = require('../../models');

const createWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, payment_method, bank_name, account_number, ifsc_code, account_holder_name } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid withdrawal amount.' });
    }

    if (!payment_method || !['qr_code', 'bank_details'].includes(payment_method)) {
      return res.status(400).json({ success: false, message: 'Please specify a valid payment method (qr_code or bank_details).' });
    }

    // Fetch user to check balance
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (parseFloat(user.wallet_balance || 0) < parsedAmount) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Your current balance is ₹${user.wallet_balance || '0.00'}.` });
    }

    let qrCodeImagePath = null;
    let bName = null;
    let accNum = null;
    let ifsc = null;
    let accHolder = null;

    if (payment_method === 'qr_code') {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a UPI QR Code image.' });
      }
      qrCodeImagePath = `/uploads/withdrawals/${req.file.filename}`;
    } else {
      if (!bank_name || !account_number || !ifsc_code || !account_holder_name) {
        return res.status(400).json({ success: false, message: 'Please provide all bank details (Bank Name, Account Number, IFSC Code, Account Holder Name).' });
      }
      bName = bank_name.trim();
      accNum = account_number.trim();
      ifsc = ifsc_code.trim();
      accHolder = account_holder_name.trim();
    }

    // Deduct from wallet immediately
    user.wallet_balance = parseFloat((parseFloat(user.wallet_balance) - parsedAmount).toFixed(2));
    await user.save();

    // Create withdrawal request record
    const withdrawal = await Withdrawal.create({
      user_id: userId,
      amount: parsedAmount,
      payment_method,
      qr_code_image: qrCodeImagePath,
      bank_name: bName,
      account_number: accNum,
      ifsc_code: ifsc,
      account_holder_name: accHolder,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully! It is pending admin approval.',
      withdrawal,
      wallet_balance: user.wallet_balance
    });
  } catch (error) {
    console.error('createWithdrawal error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing withdrawal request.' });
  }
};

const getWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawals = await Withdrawal.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('getWithdrawals error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching withdrawal history.' });
  }
};

const getUserCommissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const commissions = await Commission.findAll({
      where: { referrer_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'ReferredUser', attributes: ['full_name', 'phone'] }
      ]
    });

    return res.status(200).json({
      success: true,
      commissions
    });
  } catch (error) {
    console.error('getUserCommissions error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching commission history.' });
  }
};

module.exports = {
  createWithdrawal,
  getWithdrawals,
  getUserCommissions
};
