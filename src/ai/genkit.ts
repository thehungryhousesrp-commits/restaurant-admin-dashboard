import {genkit, Secret} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const geminiApiKey = new Secret('GEMINI_API_KEY');

export const ai = genkit({
  plugins: [googleAI({apiKey: geminiApiKey})],
  model: 'googleai/gemini-2.5-flash',
});
