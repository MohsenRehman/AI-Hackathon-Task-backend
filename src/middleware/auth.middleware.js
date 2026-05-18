import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/env.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log('BACKEND AUTH - HEADERS:', req.headers);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  console.log('BACKEND AUTH - TOKEN:', token ? `${token.substring(0, 15)}...` : 'NONE');

  if (!token) {
    console.log('BACKEND AUTH - FAILED: No token provided');
    return next(new AppError('Not authorized to access this route', 401, 'UNAUTHORIZED'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    console.log('BACKEND AUTH - DECODED:', decoded);

    const user = await User.findById(decoded.sub).populate('subscriptionPlan');
    console.log('BACKEND AUTH - USER FOUND:', user ? user.email : 'NONE');

    if (!user) {
      console.log('BACKEND AUTH - FAILED: User not found in DB');
      return next(new AppError('The user belonging to this token no longer exists.', 401, 'UNAUTHORIZED'));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401, 'ACCOUNT_INACTIVE'));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('BACKEND AUTH - VERIFY ERROR:', error);
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired, please refresh', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Not authorized to access this route', 401, 'UNAUTHORIZED'));
  }
});
