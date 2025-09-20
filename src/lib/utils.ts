import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a direct image URL from various string formats (direct link, BBCode, HTML).
 * @param input The string to parse.
 * @returns The extracted direct image URL or the original input if no match is found.
 */
export function extractDirectImageUrl(input: string): string {
  if (!input) return "";

  // 1. Check for BBCode: [img]...[/img]
  const bbCodeMatch = input.match(/\[img\](https?:\/\/[^\]]+)\[\/img\]/);
  if (bbCodeMatch && bbCodeMatch[1]) {
    return bbCodeMatch[1];
  }

  // 2. Check for HTML: <img src="..." ...>
  const htmlMatch = input.match(/<img[^>]+src="([^"]+)"/);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1];
  }
  
  // 3. Check for linked HTML: <a href="..."><img src="..." ...></a>
  const linkedHtmlMatch = input.match(/<a[^>]+><img[^>]+src="([^"]+)"/);
  if (linkedHtmlMatch && linkedHtmlMatch[1]) {
    return linkedHtmlMatch[1];
  }

  // 4. If none of the above, assume the input might be a direct link already.
  // We don't need to do anything, the validation schema will handle it.
  return input.trim();
}
