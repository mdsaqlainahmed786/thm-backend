"use strict";
// utils/feedOrderCache.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedOrderCache = void 0;
const feedOrderCache = new Map();
// Config: tweak these to control behavior
const DEFAULT_REFRESH_COUNT = 3; // show same order for ~3 refreshes
const DEFAULT_TTL_MS = 45 * 1000; // or ~45 seconds
exports.FeedOrderCache = {
    set(userID, posts, refreshCount = DEFAULT_REFRESH_COUNT, ttlMs = DEFAULT_TTL_MS) {
        const expiresAt = Date.now() + ttlMs;
        feedOrderCache.set(userID, { posts, refreshCount, expiresAt });
    },
    get(userID) {
        const entry = feedOrderCache.get(userID);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            feedOrderCache.delete(userID);
            return null;
        }
        return entry.posts;
    },
    // returns true if entry existed (we decrement the remaining refresh count)
    decrement(userID) {
        const entry = feedOrderCache.get(userID);
        if (!entry)
            return false;
        entry.refreshCount -= 1;
        if (entry.refreshCount <= 0) {
            feedOrderCache.delete(userID);
            return false;
        }
        else {
            feedOrderCache.set(userID, entry); // update
            return true;
        }
    },
    clear(userID) {
        feedOrderCache.delete(userID);
    }
};
