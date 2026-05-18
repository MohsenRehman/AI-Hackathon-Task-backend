import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { generateAuthTokens } from '../utils/generateTokens.js';
import { successResponse } from '../utils/apiResponse.js';
import { createSubscription } from '../services/subscription.service.js';

export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400, 'EMAIL_EXISTS'));
  }

  const userRole = role && ['admin', 'doctor', 'receptionist', 'patient'].includes(role) ? role : 'patient';

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
  });

  // Admins get Enterprise plan automatically; others start with Free plan
  const initialPlan = userRole === 'admin' ? 'enterprise' : 'free';
  const subscription = await createSubscription(user._id, initialPlan);
  
  user.subscriptionPlan = subscription._id;
  await user.save();

  // If user is a patient, also create a Patient document in Patient collection
  if (userRole === 'patient') {
    const { age = 30, gender = 'male', phone = '' } = req.body;
    const { Patient } = await import('../models/Patient.model.js');
    await Patient.create({
      name,
      age: Number(age),
      gender,
      contact: {
        phone,
        email,
        address: '',
      },
      createdBy: user._id,
    });
  }

  const { accessToken, refreshToken } = generateAuthTokens(user._id);

  // Store refresh token
  user.refreshToken = refreshToken;
  await user.save();

  successResponse(res, 201, 'User registered successfully', {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated.', 401, 'ACCOUNT_INACTIVE'));
  }

  const { accessToken, refreshToken } = generateAuthTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  successResponse(res, 200, 'Login successful', {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  });
});

export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('subscriptionPlan');
  successResponse(res, 200, 'User data fetched successfully', { user });
});

export const logout = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  user.refreshToken = null;
  await user.save();
  successResponse(res, 200, 'Logged out successfully');
});
