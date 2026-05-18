import { upgradeSubscription } from '../services/subscription.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const upgradePlan = asyncHandler(async (req, res, next) => {
  const { planType } = req.body;
  const subscription = await upgradeSubscription(req.user._id, planType);
  successResponse(res, 200, 'Subscription upgraded successfully', subscription);
});

export const getMyPlan = asyncHandler(async (req, res, next) => {
  successResponse(res, 200, 'Current plan details fetched', req.user.subscriptionPlan);
});
