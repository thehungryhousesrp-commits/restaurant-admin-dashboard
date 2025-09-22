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

  Provide a direct image URL from a known free stock photo website like Pexels, Unsplash, or Pixabay. The URL must point directly to the image file (e.g., .jpg, .png).

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
    const hint = input.itemName.toLowerCase().split(' ').slice(0, 2).join(' ');

    // This is a simple map to provide consistent images for common items.
    // In a real application, this could be expanded or replaced with a more dynamic solution.
    const placeholderImages: Record<string, string> = {
      'chicken biryani': 'https://i.ibb.co/FbNpyCkT/Ambur-Chicken-Biriyani.jpg',
      'pizza': 'https://i.ibb.co/P9rBxcf/margherita-pizza.jpg',
      'pasta': 'https://i.ibb.co/jZxBprT/pasta-carbonara.jpg',
      'burger': 'https://i.ibb.co/Vvz8mPq/classic-burger.jpg',
      'coffee': 'https://i.ibb.co/wYkWLzD/cold-coffee.jpg',
      'naan': 'https://i.ibb.co/g6P8C5T/butter-naan.jpg',
      'roti': 'https://i.ibb.co/mFxT3z1/tandoori-roti.jpg',
      'paneer': 'https://i.ibb.co/Y2jY0g5/paneer-butter-masala.jpg',
      'chicken tikka': 'https://i.ibb.co/N2d7sJ4/chicken-tikka.jpg',
      'fish fingers': 'https://i.ibb.co/P9YqGkM/fish-fingers.jpg',
    }

    let imageUrl = `https://picsum.photos/seed/${input.itemName.replace(/\s/g, '-')}/600/400`; // default placeholder
    for (const key in placeholderImages) {
        if (input.itemName.toLowerCase().includes(key)) {
            imageUrl = placeholderImages[key];
            break;
        }
    }
    
    return { 
        imageUrl: imageUrl,
        imageHint: hint
    };
    
    /*
    // A simple retry mechanism in case the model doesn't return a valid URL
    for (let i = 0; i < 3; i++) {
        try {
            const {output} = await prompt(input);
            // Basic validation to ensure we got a URL
            if (output && output.imageUrl && output.imageUrl.startsWith('http')) {
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
