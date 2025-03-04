export function removePrefix(input: string, prefix: string): string {
  if (!input.startsWith(prefix)) return input

  return input.substring(prefix.length + 1)
}
