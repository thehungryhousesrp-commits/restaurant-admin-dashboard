'use server';
/**
 * @fileOverview An AI flow for generating menu item descriptions.
 *
 * - generateDescription - A function that generates a description for a menu item.
 * - GenerateDescriptionInput - The input type for the generateDescription function.
 * - GenerateDescriptionOutput - The return type for the generateDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDescriptionInputSchema = z.object({
  itemName: z.string().describe('The name of the menu item.'),
});
export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

const GenerateDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated description for the menu item.'),
});
export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

export async function generateDescription(input: GenerateDescriptionInput): Promise<GenerateDescriptionOutput> {
  return generateDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: {schema: GenerateDescriptionInputSchema},
  output: {schema: GenerateDescriptionOutputSchema},
  prompt: `You are an expert food critic and copywriter for a high-end restaurant. Your task is to write a short, appealing, and delicious-sounding description for a menu item. 
  
  The description should be a maximum of 25 words. Do not use flowery or overly complex language. Focus on key ingredients and taste profile.

  Menu Item: {{{itemName}}}`,
});

const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: GenerateDescriptionInputSchema,
    outputSchema: GenerateDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
