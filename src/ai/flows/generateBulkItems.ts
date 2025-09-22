'use server';
/**
 * @fileOverview An AI flow for generating full menu item details from a list of names.
 *
 * - generateBulkItems - A function that handles the bulk generation process.
 * - GenerateBulkItemsInput - The input type for the generateBulkItems function.
 * - GenerateBulkItemsOutput - The return type for the generateBulkItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { menuItemSchema } from '@/lib/schemas';

// Define the output for a single processed item, now including an optional imageHint
// This is used internally and by the calling component.
export const GeneratedItemSchema = menuItemSchema.extend({
    imageHint: z.string().optional(),
});
export type GeneratedItem = z.infer<typeof GeneratedItemSchema>;


const GenerateBulkItemsInputSchema = z.object({
  itemInput: z.string().describe(
    'A single line of text representing a menu item or a category heading. It might be a name like "Chicken Biryani", a name with a price like "Chicken Biryani - 450", or a category heading like "Soups" or "Starters (Veg)".'
  ),
  // We pass the last seen category as context to the AI
  lastSeenCategory: z.string().optional().describe('The last category heading seen in the list. This provides context for the current item.'),
});
export type GenerateBulkItemsInput = z.infer<typeof GenerateBulkItemsInputSchema>;


// The final output schema will be a single generated item
const GenerateBulkItemsOutputSchema = GeneratedItemSchema;
export type GenerateBulkItemsOutput = z.infer<typeof GenerateBulkItemsOutputSchema>;


export async function generateBulkItems(input: GenerateBulkItemsInput): Promise<GenerateBulkItemsOutput> {
  return generateBulkItemsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateBulkItemsPrompt',
  input: {schema: GenerateBulkItemsInputSchema},
  output: {schema: GenerateBulkItemsOutputSchema},
  prompt: `You are an expert restaurant consultant AI. Your task is to take a single line of input for a menu item and generate a complete, structured JSON object for it.

The input is: {{{itemInput}}}
The category context from the previous line is: {{{lastSeenCategory}}}

IMPORTANT: The input might be a category heading (e.g., "Soups", "Starters (Veg)", "Indian Curries (Non-Veg)"). If the input line does NOT contain a price (like '– ₹150'), it is a category heading. In that case, YOU MUST NOT generate an item. Instead, you must return an empty JSON object {} so it can be filtered out later.

Follow these steps for lines that ARE menu items (i.e., they contain a price):
1.  **Parse Input**: The input will be a name with a price (e.g., "Margherita Pizza - 499" or "Fish Fingers – ₹380"). Extract the name and the price. Ignore any currency symbols like '₹', 'Rs.', etc.
2.  **Generate Description**: Write a short, appealing, and delicious-sounding description for the menu item. Max 25 words.
3.  **Determine Category**: Use the '{{lastSeenCategory}}' as the primary context for the category. For example, if the last seen category was "Starters (Veg)", use 'starters' as the category ID. If '{{lastSeenCategory}}' is not available, determine the most logical category ID from this list: [starters, main-course, pizza, pasta, burgers, salads, desserts, beverages]. If it doesn't fit, default to 'main-course'. The category must be one of these exact IDs.
4.  **Find Image URL**: Find a direct URL for a high-quality, professional, appetizing, copyright-free stock photo of the food item. The URL must start with "https://i.ibb.co/". A good service for this is ImgBB.
5.  **Set Flags**: Determine if the item is 'isVeg', 'isSpicy', and 'isChefsSpecial' based on its name and common ingredients. 'isAvailable' should always be true by default.

If the input line is just a category heading (e.g., "Soups"), you must return an empty JSON object {} so it can be filtered out later. For valid menu items, return a single, valid JSON object that conforms to the output schema.
`,
});

const generateBulkItemsFlow = ai.defineFlow(
  {
    name: 'generateBulkItemsFlow',
    inputSchema: GenerateBulkItemsInputSchema,
    outputSchema: GenerateBulkItemsOutputSchema,
  },
  async (input) => {
    // A simple retry mechanism
    for (let i = 0; i < 3; i++) {
        try {
            // If the line doesn't contain a price indicator, it's likely a heading.
            // We can skip calling the AI for it to save costs and avoid errors.
            // A simple check for a number is a good heuristic.
            if (!/[-–]\s*₹?\s*\d/.test(input.itemInput)) {
                console.log(`Skipping heading: ${input.itemInput}`);
                // Return a special value or an empty object that can be filtered out.
                // Forcing a return that doesn't match the schema will cause an error,
                // so we return a "valid" but empty-like object to be filtered.
                // A better approach would be to pre-process the text, but this works within the current structure.
                return {} as GenerateBulkItemsOutput;
            }

            const {output} = await prompt(input);
            if (output && output.name) { // Check if the output is a valid item
                // Add a hint for the image based on the name
                return {
                    ...output,
                    imageHint: output.name.toLowerCase().split(' ').slice(0, 2).join(' ')
                };
            } else {
                 // Handle cases where the AI returns an empty object for headings
                return {} as GenerateBulkItemsOutput;
            }
        } catch(e) {
            console.error(`Attempt ${i+1} failed for "${input.itemInput}":`, e);
        }
    }
    // If all attempts fail, throw an error to be caught by the frontend.
    throw new Error(`Failed to generate details for "${input.itemInput}" after multiple attempts.`);
  }
);
