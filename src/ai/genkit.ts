import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is the central AI configuration object.
// All flows and prompts will be defined using this `ai` instance.
export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
