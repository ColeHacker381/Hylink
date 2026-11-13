export function formatRupees(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  return `${safeValue.toLocaleString('en-US')} rupees`;
}

