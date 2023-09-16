import { OpenAI } from 'openai';
import 'dotenv/config';

export const openAI = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
    organization: process.env.ORGANIZATION_ID
});
