import { defaultRangeExtractor, type Range } from '@tanstack/react-virtual';

export function extractRangeWithNeighbours(
  range: Range,
  focusedIndex: number | null
) {
  const indices = defaultRangeExtractor(range);

  if (focusedIndex === null) {
    return indices;
  }

  const neighbours = [focusedIndex - 1, focusedIndex, focusedIndex + 1].filter(
    (index) => index >= 0 && index < range.count
  );

  return [...new Set([...indices, ...neighbours])].sort((a, b) => a - b);
}
