
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for a single line of input from the raw text
const RawItemLineSchema = z.object({
  line: z.string().describe('A single line from the raw menu text, like "Chicken Biryani: 250"'),
  category: z.string().describe('The last seen category heading for this item.'),
});
export type RawItemLine = z.infer<typeof RawItemLineSchema>;

// Define the schema for the structured data we want the AI to return
export const GeneratedItemSchema = z.object({
    name: z.string().describe('The name of the dish, e.g., "Chicken Biryani"'),
    price: z.number().describe('The price of the dish, e.g., 250'),
    categoryName: z.string().describe('The category for the item, e.g., "Biryani"'),
    isVeg: z.boolean().describe('Whether the item is vegetarian. Infer this based on the name (e.g., "Chicken" is not veg).'),
}).describe('A single structured menu item extracted from a line of text.');
export type GeneratedItem = z.infer<typeof GeneratedItemSchema>;


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
export const generateBulkItems = ai.defineFlow(
  {
    name: 'generateBulkItems',
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
