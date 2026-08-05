// Server-side request throttle. The client shows a cooldown timer, but that
// is cosmetic — this is the enforcement layer. Per-instance memory is an
// accepted limitation on serverless: it still stops naive abuse loops, which
// land on a warm instance.
const MAX_TRACKED_IPS = 5_000

function createRateLimiter(windowMs: number): (ip: string) => boolean {
  const lastRequestAt = new Map<string, number>()

  return (ip: string): boolean => {
    const now = Date.now()

    if (lastRequestAt.size > MAX_TRACKED_IPS) {
      for (const [key, ts] of lastRequestAt) {
        if (now - ts > windowMs) lastRequestAt.delete(key)
      }
    }

    const last = lastRequestAt.get(ip) ?? 0
    if (now - last < windowMs) return true

    lastRequestAt.set(ip, now)
    return false
  }
}

export const isRateLimited = createRateLimiter(15_000)

// Feedback clicks are cheap writes but still shouldn't be spammable
export const isFeedbackRateLimited = createRateLimiter(2_000)
