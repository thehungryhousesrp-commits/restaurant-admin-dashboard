'use server';
/**
 * @fileOverview An AI flow for generating full menu item details from a list of names.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';                                // 1. Correct Zod import
import { findImageUrl } from './findImageUrl';
import type { GeneratedItem } from '@/components/admin/BulkUploader';

// 2. Input schema
const GenerateBulkItemsInputSchema = z.object({
  itemInput: z
    .string()
    .describe(
      'A single line representing a menu item or category heading'
    ),
  lastSeenCategory: z
    .string()
    .optional()
    .describe('Contextual category heading'),
});
export type GenerateBulkItemsInput = z.infer<
  typeof GenerateBulkItemsInputSchema
>;

// 3. AI prompt output schema
const AiOutputSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  isVeg: z.boolean(),
  isSpicy: z.boolean(),
  isChefsSpecial: z.boolean(),
  isAvailable: z.boolean(),
});
export type AiOutput = z.infer<typeof AiOutputSchema>;

// 4. Flow output is GeneratedItem (extends AiOutput plus imageUrl/imageHint/id)
export type GenerateBulkItemsOutput = GeneratedItem;

// 5. Exposed function
export async function generateBulkItems(
  input: GenerateBulkItemsInput
): Promise<GenerateBulkItemsOutput | undefined> {
  return generateBulkItemsFlow(input);
}

// 6. Define the prompt
const prompt = ai.definePrompt({
  name: 'generateBulkItemsPrompt',
  input: { schema: GenerateBulkItemsInputSchema },
  output: { schema: AiOutputSchema },
  prompt: `You are an expert restaurant consultant AI. Your task…

  Input: {{{itemInput}}}
  Context: {{{lastSeenCategory}}}

  If no price in the line, return {} (empty result).
  Else:
  1. Parse name and price.
  2. Handle only FIRST price variant.
  3. Generate 25-word max description.
  4. Use lastSeenCategory as category.
  5. Set flags isVeg, isSpicy, isChefsSpecial, isAvailable.
  Return a JSON object matching the schema.`,
});

// 7. Define the flow with both input and output schemas
const generateBulkItemsFlow = ai.defineFlow(
  {
    name: 'generateBulkItemsFlow',
    inputSchema: GenerateBulkItemsInputSchema,
    outputSchema: AiOutputSchema,      // 7a. Must supply the output schema
  },
  async (input): Promise<GenerateBulkItemsOutput | undefined> => {
    const cleanInput = input.itemInput.trim();
    if (!cleanInput) return undefined;         // 7b. Skip empty lines

    // 7c. Skip headings without price
    if (!/[-–—:]\s*₹?\s*(\d|\()/.test(cleanInput)) {
      console.log(`Skipping heading: ${cleanInput}`);
      return undefined;
    }

    // 7d. Retry logic
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { output: aiOutput } = await prompt({
          ...input,
          itemInput: cleanInput,
        });

        if (!aiOutput.name) {
          console.warn(`Empty AI output for: "${cleanInput}"`);
          return undefined;
        }

        // 7e. Fetch image URL
        const { imageUrl, imageHint } = await findImageUrl({
          itemName: aiOutput.name,
        });

        // 7f. Return full GeneratedItem (id assigned by frontend)
        return {
          ...aiOutput,
          id: '',         // Frontend appends its own temporary ID
          imageUrl,
          imageHint,
        };
      } catch (err) {
        console.error(
          `Attempt ${attempt} failed for "${cleanInput}":`,
          err
        );
        // last iteration falls through
      }
    }

    console.error(
      `All retries failed for "${cleanInput}". Skipping item.`
    );
    return undefined;
  }
);
