import { Ratelimit } from "@upstash/ratelimit";
import redis from "@/DATABASE/redis";

const searchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 m"),
  analytics: false,
  prefix: "@gwenbooks/book-search",
});

// Best-effort protection for an instance when Upstash is unreachable. This is
// intentionally process-local; Upstash remains the distributed production limit.
const localRequests = new Map<string, number[]>();
const LOCAL_WINDOW_MS = 10 * 60 * 1000;
const LOCAL_LIMIT = 30;

export function limitSearchLocally(key: string) {
  const now = Date.now();
  const recent = (localRequests.get(key) || []).filter((time) => now - time < LOCAL_WINDOW_MS);
  const success = recent.length < LOCAL_LIMIT;
  if (success) recent.push(now);
  localRequests.set(key, recent);
  if (localRequests.size > 1000) {
    for (const [entry, timestamps] of localRequests) {
      if (!timestamps.length || now - timestamps[timestamps.length - 1] >= LOCAL_WINDOW_MS) localRequests.delete(entry);
    }
  }
  return { success, reset: (recent[0] || now) + LOCAL_WINDOW_MS };
}

export default searchRateLimit;
