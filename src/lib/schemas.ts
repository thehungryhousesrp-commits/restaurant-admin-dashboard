import { z } from 'zod';

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  category: z.string().min(1, 'Category is required'),
  isAvailable: z.boolean(),
  isVeg: z.boolean(),
  isSpicy: z.boolean(),
  isChefsSpecial: z.boolean(),
  image: z.any().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
