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

// Define the output for a single processed item
const GeneratedItemSchema = menuItemSchema.extend({
    // We expect the AI to return everything needed to create a MenuItem
    imageHint: z.string().optional(),
});

const GenerateBulkItemsInputSchema = z.object({
  itemInput: z.string().describe(
    'A single line of text representing a menu item. It might just be a name like "Chicken Biryani", or a name with a price like "Chicken Biryani - 450" or "Fish Fingers – ₹380".'
  ),
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

Follow these steps:
1.  **Parse Input**: The input might be just a name (e.g., "Margherita Pizza") or a name with a price (e.g., "Margherita Pizza - 499" or "Fish Fingers – ₹380"). Extract the name and the price if provided. Ignore any currency symbols like '₹', 'Rs.', etc.
2.  **Generate Description**: Write a short, appealing, and delicious-sounding description for the menu item. Max 25 words.
3.  **Suggest Price**: If a price was NOT provided in the input, suggest a competitive price in Indian Rupees (INR) based on the item, for a mid-range restaurant in Sreerampur, West Bengal. If a price WAS provided, use that exact price. The final price must be a number.
4.  **Determine Category**: Based on the item name, determine the most logical category ID from this list: [starters, main-course, pizza, pasta, burgers, salads, desserts, beverages]. If it doesn't fit, default to 'main-course'. The category must be one of these exact IDs.
5.  **Find Image URL**: Find a direct URL for a high-quality, professional, appetizing, copyright-free stock photo of the food item. The URL must start with "https://i.ibb.co/". A good service for this is ImgBB.
6.  **Set Flags**: Determine if the item is 'isVeg', 'isSpicy', and 'isChefsSpecial' based on its name and common ingredients. 'isAvailable' should always be true by default.

Return a single, valid JSON object that conforms to the output schema.
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
            const {output} = await prompt(input);
            if (output) {
                // Add a hint for the image based on the name
                return {
                    ...output,
                    imageHint: output.name.toLowerCase().split(' ').slice(0, 2).join(' ')
                };
            }
        } catch(e) {
            console.error(`Attempt ${i+1} failed for "${input.itemInput}":`, e);
        }
    }
    // If all attempts fail, throw an error to be caught by the frontend.
    throw new Error(`Failed to generate details for "${input.itemInput}" after multiple attempts.`);
  }
);
