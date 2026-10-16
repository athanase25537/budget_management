/** Formats whole Ariary amounts with a visible thousands separator. */
export function formatAriary(value: number | null | undefined): string {
  const normalized = Math.abs(Number(value) || 0);
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
    .format(normalized)
    .replace(/\u202f/g, ' ');
}
