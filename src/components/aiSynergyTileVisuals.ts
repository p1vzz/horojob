export const AI_SYNERGY_HELIX_POINTS = Array.from({ length: 14 }).map((_, i) => {
  const t = i / 13;
  const y = 10 + t * 80;
  const x1 = 50 + Math.round(Math.sin(t * Math.PI * 3) * 18);
  const x2 = 50 - Math.round(Math.sin(t * Math.PI * 3) * 18);
  return { y, x1, x2 };
});
