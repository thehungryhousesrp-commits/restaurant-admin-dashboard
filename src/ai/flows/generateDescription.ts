'use server';
/**
 * @fileOverview A simple AI flow to generate a brief, enticing description for a menu item.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 1. Define Input Schema
const GenerateDescriptionInputSchema = z.object({
    itemName: z.string().describe('The name of the menu item to describe.'),
});
export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

// 2. Define Output Schema
const GenerateDescriptionOutputSchema = z.object({
    description: z.string().describe("A brief, 1-2 sentence enticing description of the item, written in a friendly, slightly informal tone. It should be in English but can include some Hindi words if appropriate for an Indian restaurant setting (e.g., 'masaledar twist')."),
});
export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

// 3. Define the Prompt
const generateDescriptionPrompt = ai.definePrompt({
    name: 'generateDescriptionPrompt',
    input: { schema: GenerateDescriptionInputSchema },
    output: { schema: GenerateDescriptionOutputSchema },
    prompt: `Generate a brief, enticing description for the following menu item for an Indian restaurant menu. Focus on fresh ingredients and authentic flavors. Keep it to 1-2 sentences.\n\n    Item Name: {{{itemName}}}\n    `,
});

// 4. Define and Export the Flow
export const generateDescription = ai.defineFlow(
    {
        name: 'generateDescription',
        inputSchema: GenerateDescriptionInputSchema,
        outputSchema: GenerateDescriptionOutputSchema,
    },
    async (input) => {
        const { output } = await generateDescriptionPrompt(input);
        // Handle cases where the model might fail to generate a description
        if (!output) {
            return { description: "A delicious menu item. Description will be added soon." };
        }
        return output;
    }
);
