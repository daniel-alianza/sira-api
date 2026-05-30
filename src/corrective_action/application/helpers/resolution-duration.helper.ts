export function calculateResolutionDurationMinutes(
  signedAt: Date,
  resolvedAt: Date,
): number {
  const diffMs = resolvedAt.getTime() - signedAt.getTime();
  return Math.max(0, Math.round(diffMs / 60_000));
}
