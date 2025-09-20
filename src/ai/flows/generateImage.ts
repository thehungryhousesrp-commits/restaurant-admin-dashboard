'use server';
/**
 * @fileOverview An AI flow for generating menu item images.
 *
 * - generateImage - A function that generates an image for a menu item.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const GenerateImageInputSchema = z.object({
  itemName: z.string().describe('The name of the menu item.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
        // Switch to a free model to avoid billing errors.
        model: googleAI.model('gemini-2.5-flash-image-preview'),
        prompt: `A professional, appetizing, high-resolution photo of ${input.itemName} on a clean, simple restaurant table background.`,
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
    });

    if (!media.url) {
        throw new Error("Image generation failed to return a data URI.");
    }
    
    return { imageUrl: media.url };
  }
);

    