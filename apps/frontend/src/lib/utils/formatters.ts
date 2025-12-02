/**
 * Formatting utilities for display values.
 */

/**
 * Format academic term for display.
 * Converts YYYYPP format to "YYYY-PP" or readable period name.
 *
 * @example formatTerm(202410) => "2024-10"
 * @example formatTerm(202420, true) => "2024 Summer"
 */
export function formatTerm(term: number, usePeriodName = false): string {
  const year = Math.floor(term / 100);
  const period = term % 100;

  if (usePeriodName) {
    const periodNames: Record<number, string> = {
      10: 'Spring',
      20: 'Summer',
      30: 'Fall',
    };
    return `${year} ${periodNames[period] ?? period}`;
  }

  return `${year}-${period.toString().padStart(2, '0')}`;
}

/**
 * Format a number as a percentage string.
 *
 * @example formatPercent(89.47) => "89.5%"
 * @example formatPercent(89.47, 2) => "89.47%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with explicit sign.
 *
 * @example formatWithSign(5) => "+5"
 * @example formatWithSign(-3) => "-3"
 * @example formatWithSign(0) => "0"
 */
export function formatWithSign(value: number): string {
  if (value > 0) return `+${value}`;
  return value.toString();
}

/**
 * Get CSS class for accuracy level based on percentage.
 */
export function getAccuracyColorClass(accuracy: number): string {
  if (accuracy >= 95) return 'text-emerald-400';
  if (accuracy >= 85) return 'text-amber-400';
  if (accuracy >= 70) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Get background CSS class for accuracy badge based on percentage.
 */
export function getAccuracyBadgeClass(accuracy: number): string {
  if (accuracy >= 95) return 'bg-emerald-500/20 text-emerald-300';
  if (accuracy >= 85) return 'bg-amber-500/20 text-amber-300';
  if (accuracy >= 70) return 'bg-orange-500/20 text-orange-300';
  return 'bg-red-500/20 text-red-300';
}

/**
 * Get color class for error direction.
 */
export function getErrorDirectionClass(
  direction: 'over' | 'under' | 'exact',
): string {
  switch (direction) {
    case 'over':
      return 'text-blue-400';
    case 'under':
      return 'text-amber-400';
    case 'exact':
      return 'text-emerald-400';
  }
}
