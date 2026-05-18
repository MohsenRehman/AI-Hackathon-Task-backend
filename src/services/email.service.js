import { config } from '../config/env.js';
// Note: You would normally use nodemailer here
// import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, html }) => {
  // Mock email service for now, implement nodemailer in production
  console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
  return true;
};
