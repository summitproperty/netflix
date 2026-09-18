/** Tailwind-friendly className joiner (no external dependency). */
export function cn(
  ...values: Array<string | number | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
