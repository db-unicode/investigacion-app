import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names with support for conditional classes.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(...inputs));
};
