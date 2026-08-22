const { Withdrawal, User } = require('../../models');

const getWithdrawals = async (req, res) => {
  try {
    // Fetch all withdrawals. Order by pending first, then newest first
    const withdrawals = await Withdrawal.findAll({
      order: [
        // Sorts by status: 'pending' first (custom sort isn't natively standard across dialects without raw SQL,
        // but we can sort by status ASC since 'approved' starts with a, 'pending' with p, 'rejected' with r.
        // Wait, 'approved' < 'pending' < 'rejected' alphabetically.
        // Let's do order: [['status', 'DESC'], ['created_at', 'DESC']] which puts 'pending' and 'rejected' first, or we can just sort by created_at DESC or handle sorting programmatically.
        // To be safe and deterministic, let's sort by created_at DESC, and we'll separate them or label them beautifully in the UI.)
        ['created_at', 'DESC']
      ],
      include: [
        { model: User, attributes: ['id', 'full_name', 'phone', 'wallet_balance'] }
      ]
    });

    // Programmatically sort pending requests to the top
    withdrawals.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.render('withdrawals/list', {
      activePage: 'withdrawals',
      withdrawals,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getWithdrawals error:', error);
    res.status(500).send('Error loading withdrawals list');
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const withdrawal = await Withdrawal.findByPk(id);
    if (!withdrawal) {
      return res.redirect('/admin/withdrawals?error=Withdrawal+request+not+found');
    }

    if (withdrawal.status !== 'pending') {
      return res.redirect('/admin/withdrawals?error=Withdrawal+request+is+already+' + withdrawal.status);
    }

    withdrawal.status = 'approved';
    withdrawal.admin_notes = admin_notes ? admin_notes.trim() : 'Approved and processed manually.';
    await withdrawal.save();

    res.redirect('/admin/withdrawals?success=Withdrawal+request+approved+successfully');
  } catch (error) {
    console.error('approveWithdrawal error:', error);
    res.redirect('/admin/withdrawals?error=Error+approving+withdrawal+request');
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    if (!admin_notes || admin_notes.trim() === '') {
      return res.redirect('/admin/withdrawals?error=Rejection+reason+is+required');
    }

    const withdrawal = await Withdrawal.findByPk(id);
    if (!withdrawal) {
      return res.redirect('/admin/withdrawals?error=Withdrawal+request+not+found');
    }

    if (withdrawal.status !== 'pending') {
      return res.redirect('/admin/withdrawals?error=Withdrawal+request+is+already+' + withdrawal.status);
    }

    // Refund the user's wallet balance
    const user = await User.findByPk(withdrawal.user_id);
    if (user) {
      user.wallet_balance = parseFloat((parseFloat(user.wallet_balance) + parseFloat(withdrawal.amount)).toFixed(2));
      await user.save();
    }

    withdrawal.status = 'rejected';
    withdrawal.admin_notes = admin_notes.trim();
    await withdrawal.save();

    res.redirect('/admin/withdrawals?success=Withdrawal+request+rejected+successfully+and+amount+refunded+to+user');
  } catch (error) {
    console.error('rejectWithdrawal error:', error);
    res.redirect('/admin/withdrawals?error=Error+rejecting+withdrawal+request');
  }
};

module.exports = {
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};
