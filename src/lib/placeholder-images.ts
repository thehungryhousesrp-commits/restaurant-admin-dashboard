import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
  isAvailable: boolean;
  isVeg: boolean;
  isSpicy: boolean;
  isChefsSpecial: boolean;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
