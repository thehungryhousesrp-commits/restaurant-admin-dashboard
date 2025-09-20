'use server';
/**
 * @fileOverview An AI flow for finding a relevant image URL for a menu item.
 *
 * - findImageUrl - A function that finds an image URL for a menu item.
 * - FindImageUrlInput - The input type for the findImageUrl function.
 * - FindImageUrlOutput - The return type for the findImageUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindImageUrlInputSchema = z.object({
  itemName: z.string().describe('The name of the menu item.'),
});
export type FindImageUrlInput = z.infer<typeof FindImageUrlInputSchema>;

const FindImageUrlOutputSchema = z.object({
  imageUrl: z.string().url().describe('A URL to a copyright-free, high-quality stock photo of the food item.'),
  imageHint: z.string().describe('A one or two-word hint for the image, like "chicken biryani" or "veg pizza".'),
});
export type FindImageUrlOutput = z.infer<typeof FindImageUrlOutputSchema>;

export async function findImageUrl(input: FindImageUrlInput): Promise<FindImageUrlOutput> {
  return findImageUrlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findImageUrlPrompt',
  input: {schema: FindImageUrlInputSchema},
  output: {schema: FindImageUrlOutputSchema},
  prompt: `You are an expert at finding stock photos. Your task is to find a URL for a high-quality, professional, appetizing, copyright-free stock photo of the given menu item.

  The image should be suitable for a restaurant menu. It should be on a clean, simple background. The food should look delicious and be the main focus of the image.

  Provide a direct image URL from a known free stock photo website like Pexels, Unsplash, or Pixabay.

  Also, provide a simple two-word "imageHint" based on the item name that can be used for accessibility and future searches.

  Menu Item: {{{itemName}}}
  `,
});

const findImageUrlFlow = ai.defineFlow(
  {
    name: 'findImageUrlFlow',
    inputSchema: FindImageUrlInputSchema,
    outputSchema: FindImageUrlOutputSchema,
  },
  async (input) => {
    // For this app, we will use a placeholder service to avoid external dependencies and costs.
    // In a real app, you might use the prompt logic below.
    console.log("Using placeholder image service for menu item:", input.itemName);
    const seed = input.itemName.replace(/\s+/g, '-').toLowerCase();
    return { 
        imageUrl: `https://picsum.photos/seed/${seed}/600/400`,
        imageHint: input.itemName.toLowerCase().split(' ').slice(0, 2).join(' ')
    };
    
    /*
    // A simple retry mechanism in case the model doesn't return a valid URL
    for (let i = 0; i < 3; i++) {
        try {
            const {output} = await prompt(input);
            // Basic validation to ensure we got a URL
            if (output && output.imageUrl && output.imageUrl.startsWith('https')) {
                return output;
            }
        } catch(e) {
            console.error(`Attempt ${i+1} failed to find image URL:`, e);
        }
    }
    // If all attempts fail, return a fallback placeholder
    console.warn("Could not find an image URL after multiple attempts. Using a placeholder.");
    return { 
        imageUrl: `https://picsum.photos/seed/${input.itemName.replace(/\s/g, '-')}/600/400`,
        imageHint: input.itemName.toLowerCase().split(' ').slice(0, 2).join(' ')
    };
    */
  }
);
