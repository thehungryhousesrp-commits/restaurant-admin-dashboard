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
    // This is much more reliable than a random image generator.
    const placeholderImages: Record<string, string> = {
      'biryani': 'https://i.ibb.co/FbNpyCkT/Ambur-Chicken-Biriyani.jpg',
      'pizza': 'https://i.ibb.co/P9rBxcf/margherita-pizza.jpg',
      'pasta': 'https://i.ibb.co/jZxBprT/pasta-carbonara.jpg',
      'burger': 'https://i.ibb.co/Vvz8mPq/classic-burger.jpg',
      'coffee': 'https://i.ibb.co/Wp7s2s3/cold-coffee.jpg',
      'naan': 'https://i.ibb.co/3W6ZzW8/butter-naan.jpg',
      'roti': 'https://i.ibb.co/pXWdGz9/tandoori-roti.jpg',
      'paneer': 'https://i.ibb.co/0Vz3nSg/paneer-butter-masala.jpg',
      'chicken tikka': 'https://i.ibb.co/2dGf02G/chicken-tikka.jpg',
      'chilli chicken': 'https://i.ibb.co/3sxyyq4/chilli-chicken.jpg',
      'fish fingers': 'https://i.ibb.co/Bqg3r58/fish-fingers.jpg',
      'kofta': 'https://i.ibb.co/Qv5fPz9/malai-kofta.jpg',
      'dal makhani': 'https://i.ibb.co/wK4H4T5/dal-makhani.jpg',
      'butter chicken': 'https://i.ibb.co/n7Z0M3m/butter-chicken.jpg',
      'rogan josh': 'https://i.ibb.co/VDB2MTP/mutton-rogan-josh.jpg',
      'egg curry': 'https://i.ibb.co/Kz2b6sV/egg-curry.jpg',
      'fried rice': 'https://i.ibb.co/R4m2GjY/veg-fried-rice.jpg',
      'gulab jamun': 'https://i.ibb.co/L8mD9Yf/gulab-jamun.jpg',
      'brownie': 'https://i.ibb.co/mFkbtJp/brownie-ice-cream.jpg',
      'rasmalai': 'https://i.ibb.co/b3F9gN6/rasmalai.jpg',
      'soda': 'https://i.ibb.co/D88qf9R/fresh-lime-soda.jpg',
      'mocktail': 'https://i.ibb.co/RpjL4wJ/mocktail.jpg',
      'soup': 'https://i.ibb.co/h7gJj4p/tomato-soup.jpg',
      'spring roll': 'https://i.ibb.co/zHqP9Cg/spring-rolls.jpg',
      'chilli potato': 'https://i.ibb.co/k2V3x9C/chilli-potato.jpg',
    };

    const itemNameLower = input.itemName.toLowerCase();
    let imageUrl = `https://i.ibb.co/yYc7Pgm/generic-food-placeholder.jpg`; // A generic, but relevant, default placeholder

    for (const key in placeholderImages) {
        if (itemNameLower.includes(key)) {
            imageUrl = placeholderImages[key];
            break;
        }
    }
    
    return { 
        imageUrl: imageUrl,
        imageHint: hint
    };
  }
);
