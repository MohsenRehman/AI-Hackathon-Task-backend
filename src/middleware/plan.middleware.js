import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requirePlan = (feature) => {
  return asyncHandler(async (req, res, next) => {
    // Admin bypass
    if (req.user.role === 'admin') {
      return next();
    }

    if (!req.user || !req.user.subscriptionPlan) {
      const { Subscription } = await import('../models/Subscription.model.js');
      const { createSubscription } = await import('../services/subscription.service.js');
      let sub = await Subscription.findOne({ userId: req.user._id });
      if (!sub) {
        sub = await createSubscription(req.user._id, 'free');
      }
      req.user.subscriptionPlan = sub;
    }

    const plan = req.user.subscriptionPlan;

    // Check if plan has expired (assuming 'active' status is required)
    if (plan.status !== 'active') {
      return next(new AppError('Your subscription plan is inactive or expired.', 403, 'PLAN_EXPIRED'));
    }

    // Check specific feature
    if (plan.features[feature] !== true && plan.features[feature] !== -1) {
      return next(new AppError(`Upgrade to Pro/Enterprise to access ${feature}`, 403, 'PLAN_LIMIT_EXCEEDED'));
    }

    next();
  });
};
