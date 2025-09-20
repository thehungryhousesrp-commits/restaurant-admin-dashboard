'use server';
/**
 * @fileOverview An AI flow for suggesting a price for a menu item.
 *
 * - suggestPrice - A function that suggests a price for a menu item.
 * - SuggestPriceInput - The input type for the suggestPrice function.
 * - SuggestPriceOutput - The return type for the suggestPrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPriceInputSchema = z.object({
  itemName: z.string().describe('The name of the menu item.'),
  description: z.string().describe('The description of the menu item.'),
});
export type SuggestPriceInput = z.infer<typeof SuggestPriceInputSchema>;

const SuggestPriceOutputSchema = z.object({
  price: z.number().describe('The suggested price for the menu item in Indian Rupees (INR).'),
});
export type SuggestPriceOutput = z.infer<typeof SuggestPriceOutputSchema>;

export async function suggestPrice(input: SuggestPriceInput): Promise<SuggestPriceOutput> {
  return suggestPriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPricePrompt',
  input: {schema: SuggestPriceInputSchema},
  output: {schema: SuggestPriceOutputSchema},
  prompt: `You are an expert restaurant consultant specializing in menu pricing for the Indian market, specifically for Sreerampur, West Bengal. Your task is to suggest a competitive and reasonable price in Indian Rupees (INR) for a new menu item.

  Consider the item's name, description, and typical ingredients. Base your suggestion on average prices in a mid-range, modern restaurant in Sreerampur, West Bengal.
  
  Do not explain your reasoning. Only return the suggested price as a number.

  Menu Item: {{{itemName}}}
  Description: {{{description}}}
  `,
});

const suggestPriceFlow = ai.defineFlow(
  {
    name: 'suggestPriceFlow',
    inputSchema: SuggestPriceInputSchema,
    outputSchema: SuggestPriceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
