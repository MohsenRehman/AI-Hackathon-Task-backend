import { User } from '../models/User.model.js';
import { Patient } from '../models/Patient.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { createSubscription } from '../services/subscription.service.js';

export const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().populate('subscriptionPlan').lean();
  successResponse(res, 200, 'Users fetched successfully', users);
});

export const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400, 'EMAIL_EXISTS'));
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  const subscription = await createSubscription(user._id, role === 'admin' ? 'enterprise' : 'free');
  user.subscriptionPlan = subscription._id;
  await user.save();

  // If user is a patient, also create a Patient document in Patient collection
  if (role === 'patient') {
    const { age = 30, gender = 'male', phone = '' } = req.body;
    await Patient.create({
      name,
      age: Number(age),
      gender,
      contact: {
        phone,
        email,
        address: '',
      },
      createdBy: req.user._id,
    });
  }

  successResponse(res, 201, 'User created successfully', user);
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, role, isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  successResponse(res, 200, 'User updated successfully', user);
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  successResponse(res, 200, 'User deleted successfully');
});

export const updateProfileImage = asyncHandler(async (req, res, next) => {
  successResponse(res, 200, 'Profile image updated (mock)', { profileImage: 'http://example.com/image.jpg' });
});
