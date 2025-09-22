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
import { findImageUrl } from './findImageUrl';
import { type GeneratedItem } from '@/components/admin/BulkUploader';

const GenerateBulkItemsInputSchema = z.object({
  itemInput: z.string().describe(
    'A single line of text representing a menu item or a category heading. It might be a name like "Chicken Biryani", a name with a price like "Chicken Biryani - 450", or a category heading like "Soups" or "Starters (Veg)".'
  ),
  lastSeenCategory: z.string().optional().describe('The last category heading seen in the list. This provides context for the current item.'),
});
export type GenerateBulkItemsInput = z.infer<typeof GenerateBulkItemsInputSchema>;


// The output schema for the AI prompt itself, which doesn't include image details.
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

// The final output type for the entire flow will be the GeneratedItem from the component
export type GenerateBulkItemsOutput = GeneratedItem;


export async function generateBulkItems(input: GenerateBulkItemsInput): Promise<GenerateBulkItemsOutput> {
  return generateBulkItemsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateBulkItemsPrompt',
  input: {schema: GenerateBulkItemsInputSchema},
  output: {schema: AiOutputSchema},
  prompt: `You are an expert restaurant consultant AI. Your task is to take a single line of input for a menu item and generate a complete, structured JSON object for it.

The input is: {{{itemInput}}}
The category context from the previous line is: {{{lastSeenCategory}}}

IMPORTANT: The input might be a category heading (e.g., "Soups", "Starters (Veg)", "Indian Curries (Non-Veg)"). If the input line does NOT contain a price (like '– ₹150' or '- 150'), it is a category heading. In that case, YOU MUST NOT generate an item. Instead, you must return an empty JSON object {} so it can be filtered out later.

Follow these steps for lines that ARE menu items (i.e., they contain a price):
1.  **Parse Input**: The input will be a name with a price (e.g., "Margherita Pizza - 499" or "Fish Fingers – ₹380"). Extract the name and the price. Ignore any currency symbols like '₹', 'Rs.', etc.
2.  **Generate Description**: Write a short, appealing, and delicious-sounding description for the menu item. Max 25 words.
3.  **Determine Category**: Use the '{{lastSeenCategory}}' as the primary context for the category. The category name should be simple, like 'Soups' or 'Starters (Veg)'. Do not use IDs. For example, if the last seen category was "Starters (Veg)", use 'Starters (Veg)'. If '{{lastSeenCategory}}' is not available, determine the most logical category from the item name.
4.  **Set Flags**: Determine if the item is 'isVeg', 'isSpicy', and 'isChefsSpecial' based on its name and common ingredients. 'isAvailable' should always be true by default.

Return a single, valid JSON object that conforms to the output schema. Do NOT include image information.
`,
});

const generateBulkItemsFlow = ai.defineFlow(
  {
    name: 'generateBulkItemsFlow',
    inputSchema: GenerateBulkItemsInputSchema,
  },
  async (input): Promise<GenerateBulkItemsOutput> => {
    // A simple retry mechanism
    for (let i = 0; i < 3; i++) {
        try {
            // Pre-process the input to remove extra spaces.
            const cleanInput = input.itemInput.trim();
            if (!cleanInput) {
                 return {} as GeneratedItem;
            }
            
            // If the line doesn't contain a price indicator, it's likely a heading.
            // A simple check for a number is a good heuristic.
            if (!/[-–]\s*₹?\s*\d/.test(cleanInput)) {
                console.log(`Skipping heading: ${cleanInput}`);
                return {} as GeneratedItem;
            }

            const {output: aiOutput} = await prompt({...input, itemInput: cleanInput});

            if (aiOutput && aiOutput.name) { 
                // Now, call the dedicated image flow
                const imageResult = await findImageUrl({ itemName: aiOutput.name });

                return {
                    ...aiOutput,
                    id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for the UI
                    imageUrl: imageResult.imageUrl,
                    imageHint: imageResult.imageHint
                };
            } else {
                console.warn(`AI returned empty output for "${input.itemInput}". Skipping.`);
                // Return an empty object that can be filtered out by the frontend.
                return {} as GeneratedItem;
            }
        } catch(e) {
            console.error(`Attempt ${i+1} failed for "${input.itemInput}":`, e);
        }
    }
    // If all attempts fail, DO NOT throw an error. Instead, return an empty object.
    // This prevents one failed item from stopping the entire batch.
    // The frontend will be responsible for notifying the user about the failure.
    console.error(`Failed to generate details for "${input.itemInput}" after multiple attempts. Skipping.`);
    return {} as GeneratedItem;
  }
);
