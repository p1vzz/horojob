export const DEEP_DIVE_ZODIAC_SIGNS = [
  '\u2648\uFE0E',
  '\u2649\uFE0E',
  '\u264A\uFE0E',
  '\u264B\uFE0E',
  '\u264C\uFE0E',
  '\u264D\uFE0E',
  '\u264E\uFE0E',
  '\u264F\uFE0E',
  '\u2650\uFE0E',
  '\u2651\uFE0E',
  '\u2652\uFE0E',
  '\u2653\uFE0E',
] as const;

export const DEEP_DIVE_BLUR_POSITIONS = DEEP_DIVE_ZODIAC_SIGNS.map((s, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  return { s, x: Math.cos(angle) * 55, y: Math.sin(angle) * 55 };
});
