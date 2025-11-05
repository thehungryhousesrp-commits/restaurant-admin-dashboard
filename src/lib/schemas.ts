
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
