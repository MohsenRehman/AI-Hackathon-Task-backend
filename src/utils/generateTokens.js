import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateAuthTokens = (userId) => {
  const payload = { sub: userId };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });

  return { accessToken, refreshToken };
};
