export function formatHudAmount(value: number): string {
  const rounded = Math.max(0, Math.floor(value));
  if (rounded >= 1000) return `${(rounded / 1000).toFixed(1)}K`;
  return String(rounded);
}

export function formatResourceHudValue(value: number, capacity: number): string {
  return `${formatHudAmount(value)} / ${formatHudAmount(capacity)}`;
}
