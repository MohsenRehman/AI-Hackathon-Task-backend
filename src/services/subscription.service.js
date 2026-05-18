import { Subscription } from '../models/Subscription.model.js';

const PLAN_FEATURES = {
  free: {
    maxPatients: 20,
    aiEnabled: false,
    advancedAnalytics: false,
    multiDoctor: false,
    exportReports: false,
  },
  pro: {
    maxPatients: -1, // Unlimited
    aiEnabled: true,
    advancedAnalytics: true,
    multiDoctor: false,
    exportReports: true,
  },
  enterprise: {
    maxPatients: -1,
    aiEnabled: true,
    advancedAnalytics: true,
    multiDoctor: true,
    exportReports: true,
  },
};

export const createSubscription = async (userId, planType = 'free') => {
  const features = PLAN_FEATURES[planType] || PLAN_FEATURES['free'];
  
  const subscription = await Subscription.create({
    userId,
    plan: planType,
    features,
    status: 'active',
  });
  
  return subscription;
};

export const upgradeSubscription = async (userId, planType) => {
  const features = PLAN_FEATURES[planType];
  if (!features) throw new Error('Invalid plan type');

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiry

  const subscription = await Subscription.findOneAndUpdate(
    { userId },
    {
      plan: planType,
      features,
      status: 'active',
      expiryDate,
    },
    { new: true }
  );

  return subscription;
};
