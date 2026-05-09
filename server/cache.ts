type CacheItem<T> = {
  value: T;
  expiry: number;
};

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  /**
   * Sets a value in the cache with a Time-to-Live (TTL) in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
    
    // Auto-cleanup after expiry
    setTimeout(() => {
      this.deleteIfExpired(key);
    }, ttlSeconds * 1000);
  }

  /**
   * Gets a value from the cache. Returns null if expired or not found.
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Deletes a key from the cache (Alias for invalidate).
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidates a key (Alias for delete).
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Deletes a key only if it has expired.
   */
  private deleteIfExpired(key: string): void {
    const item = this.cache.get(key);
    if (item && Date.now() > item.expiry) {
      this.cache.delete(key);
    }
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const serverCache = new MemoryCache();
