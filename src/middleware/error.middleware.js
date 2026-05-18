import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
};

export const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new AppError(message, statusCode, 'INTERNAL_ERROR');
    // If it's a mongoose cast error
    if (err.name === 'CastError') {
      error = new AppError(`Resource not found. Invalid: ${err.path}`, 404, 'RESOURCE_NOT_FOUND');
    }
    // If it's a mongoose duplicate key error
    if (err.code === 11000) {
      const message = `Duplicate field value entered`;
      error = new AppError(message, 400, 'DUPLICATE_FIELD_VALUE');
    }
    // If it's a mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((val) => val.message);
      error = new AppError('Validation Error', 400, 'VALIDATION_ERROR', message);
    }
  }

  const response = {
    success: false,
    message: error.message,
    code: error.code,
  };

  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  if (config.env === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};
