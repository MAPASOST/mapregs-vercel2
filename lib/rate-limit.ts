// Server-side request throttle. The client shows a cooldown timer, but that
// is cosmetic — this is the enforcement layer. Per-instance memory is an
// accepted limitation on serverless: it still stops naive abuse loops, which
// land on a warm instance.
const lastRequestAt = new Map<string, number>()

export const RATE_LIMIT_WINDOW_MS = 15_000
const MAX_TRACKED_IPS = 5_000

export function isRateLimited(ip: string): boolean {
  const now = Date.now()

  if (lastRequestAt.size > MAX_TRACKED_IPS) {
    for (const [key, ts] of lastRequestAt) {
      if (now - ts > RATE_LIMIT_WINDOW_MS) lastRequestAt.delete(key)
    }
  }

  const last = lastRequestAt.get(ip) ?? 0
  if (now - last < RATE_LIMIT_WINDOW_MS) return true

  lastRequestAt.set(ip, now)
  return false
}
