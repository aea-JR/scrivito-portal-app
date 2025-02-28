import dotenv from 'dotenv'
dotenv.config()

/** Ensures value of given key is present in ENV */
export function ensureEnv(key: string): string {
  const value = process.env[key]
  assert(value, `Env ${key} is not set!`)
  return value
}

export function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg)
}

export async function sleep(miliseconds: number) {
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), miliseconds)
  })
}
