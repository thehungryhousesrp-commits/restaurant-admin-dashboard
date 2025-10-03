'use server';
/**
 * @fileOverview A "service" flow that simulates finding an image URL for a menu item.
 * In a real application, this would call an image search API or a database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 1. Define Input Schema
const FindImageUrlInputSchema = z.object({
    itemName: z.string().describe('The name of the menu item to find an image for.'),
});
export type FindImageUrlInput = z.infer<typeof FindImageUrlInputSchema>;

// 2. Define Output Schema
const FindImageUrlOutputSchema = z.object({
    imageUrl: z.string().url().describe('A placeholder image URL.'),
    imageHint: z.string().describe('The simplified search term used to find the image.'),
});
export type FindImageUrlOutput = z.infer<typeof FindImageUrlOutputSchema>;

// 3. Define and Export the "Service" Flow
// This is a flow that doesn't use AI, it just performs a task. 
// Genkit flows are great for instrumenting and managing any async function.
export const findImageUrl = ai.defineFlow(
    {
        name: 'findImageUrl',
        inputSchema: FindImageUrlInputSchema,
        outputSchema: FindImageUrlOutputSchema,
    },
    async (input) => {
        // Create a simplified search term (e.g., "Veg Pulao" -> "veg pulao")
        const searchTerm = input.itemName
            .toLowerCase()
            .replace(/\(.*?\)/g, '') // Remove content in parentheses
            .trim();

        // In a real app, you'd use a service like Pexels, Unsplash, or Google Custom Search.
        // For this demo, we'll just return a consistent placeholder from pexels.com
        const imageUrl = `https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`;

        return {
            imageUrl,
            imageHint: searchTerm,
        };
    }
);
