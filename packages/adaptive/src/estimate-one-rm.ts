export function estimateOneRm(input: {
  loadKg: number;
  reps: number;
  rir?: number | null;
}): number {
  const w = input.loadKg;
  const r = input.reps;
  if (!w || !r) return 0;
  const reserve = input.rir == null || Number.isNaN(Number(input.rir)) ? 0 : Number(input.rir);
  const effective = Math.max(1, Math.min(20, r + Math.max(0, Math.min(10, reserve))));
  return Math.round(w * (1 + effective / 30) * 10) / 10;
}
