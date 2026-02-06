import { createClient } from "redis";

/**
 * Shared Redis client singleton.
 *
 * Why this exists:
 * - Avoid circular imports like `model -> server -> app -> routes -> controller -> model`
 * - Allow any module to access Redis without importing `server.ts`
 */
export const RedisClient = createClient({
  url: process.env.REDIS_URL, // optional; falls back to localhost if undefined
});

let initialized = false;

export async function initRedis() {
  if (initialized) return;
  initialized = true;

  RedisClient.on("error", (err) => {
    console.error("Redis Error:", err);
  });

  try {
    if (!RedisClient.isOpen) {
      await RedisClient.connect();
    }
  } catch (err) {
    // Don't crash the app if Redis is unavailable; callers should handle cache misses.
    console.error("Redis connect failed:", err);
  }
}


