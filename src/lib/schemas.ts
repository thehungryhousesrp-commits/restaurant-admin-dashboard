
import { z } from 'zod';

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  category: z.string().min(1, 'Category is required'),
  isAvailable: z.boolean(),
  isVeg: z.boolean(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export const tableSchema = z.object({
  name: z.string().min(1, 'Table name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'A valid phone number is required'),
});

export const createRestaurantSchema = z.object({
  restaurantName: z.string().min(3, 'Restaurant name is required'),
});

// Schemas for AI Bulk Generation
export const RawItemLineSchema = z.object({
  line: z.string().describe('A single line from the raw menu text, like "Chicken Biryani: 250"'),
  category: z.string().describe('The last seen category heading for this item.'),
});

export const GeneratedItemSchema = z.object({
    name: z.string().describe('The name of the dish, e.g., "Chicken Biryani"'),
    price: z.number().describe('The price of the dish, e.g., 250'),
    categoryName: z.string().describe('The category for the item, e.g., "Biryani"'),
    isVeg: z.boolean().describe('Whether the item is vegetarian. Infer this based on the name (e.g., "Chicken" is not veg).'),
}).describe('A single structured menu item extracted from a line of text.');
