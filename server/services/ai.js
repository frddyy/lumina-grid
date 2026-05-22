import { GoogleGenAI } from '@google/genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in .env");
  process.exit(1);
}

export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const getLangChainLLM = () => new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: GEMINI_API_KEY,
  temperature: 0.2
});
