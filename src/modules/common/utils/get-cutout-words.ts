export function getCutoutWords(text: string) {
  let letterIndex = 0;

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const startIndex = letterIndex;
      const letters = Array.from(word, (letter) => ({
        letter,
        index: letterIndex++,
      }));

      return { startIndex, letters };
    });
}
