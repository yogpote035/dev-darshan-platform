const { SubscriptionPlan } = require('../../models');

const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({ order: [['price', 'ASC']] });
    res.render('plans/list', {
      activePage: 'plans',
      plans,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getPlans error:', error);
    res.status(500).send('Error loading subscription plans');
  }
};

const getAddPlan = (req, res) => {
  res.render('plans/add', { activePage: 'plans', error: null });
};

const postAddPlan = async (req, res) => {
  try {
    const { plan_name, price, razorpay_plan_id, duration_days, description, status } = req.body;

    if (!plan_name || !price || !duration_days) {
      return res.render('plans/add', {
        activePage: 'plans',
        error: 'Plan Name, Price, and Duration are required.'
      });
    }

    await SubscriptionPlan.create({
      plan_name,
      price: parseFloat(price),
      razorpay_plan_id: razorpay_plan_id || null,
      duration_days: parseInt(duration_days),
      description,
      status: status === '1' ? 1 : 0
    });

    res.redirect('/admin/plans?success=Subscription+plan+created+successfully');
  } catch (error) {
    console.error('postAddPlan error:', error);
    res.render('plans/add', { activePage: 'plans', error: 'Error creating subscription plan.' });
  }
};

const getEditPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.redirect('/admin/plans?error=Plan+not+found');
    }
    res.render('plans/edit', { activePage: 'plans', plan, error: null });
  } catch (error) {
    console.error('getEditPlan error:', error);
    res.redirect('/admin/plans?error=Error+loading+edit+page');
  }
};

const postEditPlan = async (req, res) => {
  let plan;
  try {
    const { id } = req.params;
    const { plan_name, price, razorpay_plan_id, duration_days, description, status } = req.body;

    plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.redirect('/admin/plans?error=Plan+not+found');
    }

    if (!plan_name || !price || !duration_days) {
      return res.render('plans/edit', {
        activePage: 'plans',
        plan,
        error: 'Plan Name, Price, and Duration are required.'
      });
    }

    plan.plan_name = plan_name;
    plan.price = parseFloat(price);
    plan.razorpay_plan_id = razorpay_plan_id || null;
    plan.duration_days = parseInt(duration_days);
    plan.description = description;
    plan.status = status === '1' ? 1 : 0;
    await plan.save();

    res.redirect('/admin/plans?success=Subscription+plan+updated+successfully');
  } catch (error) {
    console.error('postEditPlan error:', error);
    res.render('plans/edit', { activePage: 'plans', plan, error: 'Error updating subscription plan.' });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.redirect('/admin/plans?error=Plan+not+found');
    }
    plan.status = plan.status === 1 ? 0 : 1;
    await plan.save();
    res.redirect('/admin/plans?success=Plan+status+updated');
  } catch (error) {
    console.error('toggleStatus error:', error);
    res.redirect('/admin/plans?error=Error+updating+plan+status');
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.redirect('/admin/plans?error=Plan+not+found');
    }

    // Protect 'Free' default plan from deletion
    if (plan.plan_name.toLowerCase() === 'free') {
      return res.redirect('/admin/plans?error=The+default+Free+plan+cannot+be+deleted');
    }

    await plan.destroy();
    res.redirect('/admin/plans?success=Plan+deleted+successfully');
  } catch (error) {
    console.error('deletePlan error:', error);
    res.redirect('/admin/plans?error=Error+deleting+plan');
  }
};

module.exports = {
  getPlans,
  getAddPlan,
  postAddPlan,
  getEditPlan,
  postEditPlan,
  toggleStatus,
  deletePlan
};
