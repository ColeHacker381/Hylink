export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function calculateCompletionPercent(completed: number, total: number): number {
  if (total <= 0 || completed <= 0) return 0;
  return clampPercent((completed / total) * 100);
}

