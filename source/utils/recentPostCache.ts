

interface CachedPost {
  postID: string;
  count: number; // number of feed refreshes remaining
}

const recentPosts = new Map<string, CachedPost>();

export const UserRecentPostCache = {
  set(userID: string, postID: string) {
    recentPosts.set(userID, { postID, count: 3 });
  },

  async get(userID: string): Promise<CachedPost | undefined> {
    return recentPosts.get(userID);
  },

  async decrement(userID: string): Promise<void> {
    const entry = recentPosts.get(userID);
    if (!entry) return;
    entry.count -= 1;
    if (entry.count <= 0) {
      recentPosts.delete(userID);
    } else {
      recentPosts.set(userID, entry);
    }
  },
};
