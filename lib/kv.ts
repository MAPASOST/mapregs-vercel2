import { createClient } from '@vercel/kv'

// Supports both legacy Vercel KV env vars (KV_*) and the Upstash Redis
// marketplace integration (UPSTASH_REDIS_*). Null when no store is attached
// so callers can degrade gracefully.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

export const kv = url && token ? createClient({ url, token }) : null
