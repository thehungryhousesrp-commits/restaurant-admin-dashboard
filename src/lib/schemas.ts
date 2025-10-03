import { z } from 'zod';

export const variantSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
});

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  variants: z.array(variantSchema).min(1, "At least one price variant is required."),
  category: z.string().min(1, 'Category is required'),
  isAvailable: z.boolean(),
  isVeg: z.boolean(),
  isSpicy: z.boolean(),
  isChefsSpecial: z.boolean(),
  imageUrl: z.string().url("Please enter a valid URL.").or(z.literal("")).optional(),
  imageHint: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
