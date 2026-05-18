import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from './env.js';

let genAI = null;
let openaiClient = null;

if (config.ai.geminiKey) {
  genAI = new GoogleGenerativeAI(config.ai.geminiKey);
} else {
  console.warn('GEMINI_API_KEY is not set. Gemini integration will be disabled.');
}

if (config.ai.openaiKey) {
  openaiClient = new OpenAI({ apiKey: config.ai.openaiKey });
} else {
  console.warn('OPENAI_API_KEY is not set. OpenAI fallback will be disabled.');
}

export const getGeminiModel = (modelName = 'gemini-1.5-flash') => {
  if (!genAI) throw new Error('Gemini API is not configured');
  return genAI.getGenerativeModel({ model: modelName });
};

export const getOpenAIClient = () => {
  if (!openaiClient) throw new Error('OpenAI API is not configured');
  return openaiClient;
};
