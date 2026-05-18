import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requirePlan = (feature) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.subscriptionPlan) {
      return next(new AppError('No subscription plan found. Please upgrade to access this feature.', 403, 'PLAN_LIMIT_EXCEEDED'));
    }

    const plan = req.user.subscriptionPlan;

    // Admin bypass
    if (req.user.role === 'admin') {
      return next();
    }

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
