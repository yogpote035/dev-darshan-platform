module.exports = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }

  // A user is premium if they have a plan_id greater than 1
  // and the subscription expiry date is in the future
  const hasPremiumPlan = user.plan_id && user.plan_id > 1;
  const isNotExpired = user.subscription_expiry && new Date(user.subscription_expiry) > new Date();

  if (hasPremiumPlan && isNotExpired) {
    req.isPremium = true;
    return next();
  }

  req.isPremium = false;
  return res.status(403).json({
    success: false,
    message: 'Premium subscription required. Upgrade your plan to access this content.'
  });
};
