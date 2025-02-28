export function removeSuffix(input: string, suffix: string): string {
  if (!input.endsWith(suffix)) return input;

  return input.substring(0, input.length - suffix.length);
}
