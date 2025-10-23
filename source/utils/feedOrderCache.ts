// utils/feedOrderCache.ts

interface CachedFeed {
  posts: any[];        // cached post array
  refreshCount: number;// remaining refreshes before invalidation
  expiresAt: number;   // absolute timestamp (ms) when this cache must expire
}

const feedOrderCache = new Map<string, CachedFeed>();

// Config: tweak these to control behavior
const DEFAULT_REFRESH_COUNT = 3;          // show same order for ~3 refreshes
const DEFAULT_TTL_MS = 45 * 1000;         // or ~45 seconds

export const FeedOrderCache = {
  set(userID: string, posts: any[], refreshCount = DEFAULT_REFRESH_COUNT, ttlMs = DEFAULT_TTL_MS) {
    const expiresAt = Date.now() + ttlMs;
    feedOrderCache.set(userID, { posts, refreshCount, expiresAt });
  },

  get(userID: string) {
    const entry = feedOrderCache.get(userID);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      feedOrderCache.delete(userID);
      return null;
    }
    return entry.posts;
  },

  // returns true if entry existed (we decrement the remaining refresh count)
  decrement(userID: string) {
    const entry = feedOrderCache.get(userID);
    if (!entry) return false;
    entry.refreshCount -= 1;
    if (entry.refreshCount <= 0) {
      feedOrderCache.delete(userID);
      return false;
    } else {
      feedOrderCache.set(userID, entry); // update
      return true;
    }
  },

  clear(userID: string) {
    feedOrderCache.delete(userID);
  }
};
