import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./db";

// Defense in depth on the endpoints that don't require an access token.
// The real cost gate is /api/generate requiring a valid paid token.
export const leaguesRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "ratelimit:leagues",
});

export const checkoutRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:checkout",
});

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

// A rate limiter should never be a single point of failure for the route
// it's protecting — if Redis is unreachable (e.g. not configured yet),
// fail open rather than 500ing every request.
export async function safeLimit(limiter: Ratelimit, key: string): Promise<boolean> {
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    console.error("Rate limiter unavailable, failing open", err);
    return true;
  }
}
