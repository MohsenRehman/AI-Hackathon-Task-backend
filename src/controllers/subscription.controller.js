import { upgradeSubscription } from '../services/subscription.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const upgradePlan = asyncHandler(async (req, res, next) => {
  const { planType } = req.body;
  const subscription = await upgradeSubscription(req.user._id, planType);
  successResponse(res, 200, 'Subscription upgraded successfully', subscription);
});

export const getMyPlan = asyncHandler(async (req, res, next) => {
  let plan = req.user.subscriptionPlan;
  if (!plan) {
    const { Subscription } = await import('../models/Subscription.model.js');
    const { createSubscription } = await import('../services/subscription.service.js');
    plan = await Subscription.findOne({ userId: req.user._id });
    if (!plan) {
      plan = await createSubscription(req.user._id, req.user.role === 'admin' ? 'enterprise' : 'free');
    }
  }
  successResponse(res, 200, 'Current plan details fetched', plan);
});
