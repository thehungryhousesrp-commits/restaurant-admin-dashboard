
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { next } from '@genkit-ai/next';

import { generateBulkItems } from './generateBulkItems';

export default genkit({
  plugins: [
    googleAI(),
    next({
      // These are the Genkit actions that will be exposed as API routes.
      // The `name` is the name of the action exported from the file.
      actions: [{ flow: generateBulkItems, name: 'generateBulkItems' }],
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
