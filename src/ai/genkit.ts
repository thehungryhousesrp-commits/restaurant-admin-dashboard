import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The googleAI plugin will automatically look for the GEMINI_API_KEY 
// in the environment variables (.env file).
// We don't need to use the Secret class here anymore.

export const ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.5-flash',
});
