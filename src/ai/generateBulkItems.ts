
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { RawItemLineSchema, GeneratedItemSchema, type GeneratedItem, type RawItemLine } from '@/lib/types';


// ============================================================================
// AI Prompt for Parsing a Single Item
// ============================================================================
const parseItemPrompt = ai.definePrompt({
    name: 'parseMenuItemPrompt',
    input: { schema: RawItemLineSchema },
    output: { schema: GeneratedItemSchema },
    prompt: `
        You are a menu parsing expert. Given the following line of text from a restaurant menu and its associated category, extract the item's name, price, and determine if it is vegetarian.

        - The line is: "{{line}}"
        - The current category is: "{{category}}"

        - Extract the name and price precisely.
        - Set 'categoryName' to the provided category.
        - Set 'isVeg' to 'false' if the name contains words like "Chicken", "Mutton", "Fish", "Prawn", "Egg". Otherwise, set it to 'true'.
        
        Your response must be in valid JSON format.
    `,
});

// ============================================================================
// Main Genkit Flow
// ============================================================================

/**
 * This flow takes an array of raw menu lines and processes them in parallel
 * to return a structured array of menu items.
 */
const generateBulkItemsFlow = ai.defineFlow(
  {
    name: 'generateBulkItemsFlow',
    inputSchema: z.array(RawItemLineSchema),
    outputSchema: z.array(GeneratedItemSchema),
  },
  async (rawLines) => {
    // Process each line in parallel for maximum speed
    const processingPromises = rawLines.map(async (line) => {
      try {
        const { output } = await parseItemPrompt(line);
        if (output) {
          // Validate the output against our Zod schema to ensure it's correct
          return GeneratedItemSchema.parse(output);
        }
      } catch (error) {
        console.error(`Failed to process line: "${line.line}"`, error);
      }
      return null; // Return null for lines that fail parsing
    });

    const results = await Promise.all(processingPromises);
    
    // Filter out any null results from failed lines
    return results.filter((item): item is GeneratedItem => item !== null);
  }
);


/**
 * This is the exported async function that satisfies the 'use server' constraint.
 * It acts as a simple wrapper around our Genkit flow.
 */
export async function generateBulkItems(rawLines: RawItemLine[]): Promise<GeneratedItem[]> {
  return await generateBulkItemsFlow(rawLines);
}
