export function roundToPlate(kg: number): number {
  if (!Number.isFinite(kg)) return 0;
  return Math.max(0, Math.round(kg / 2.5) * 2.5);
}
