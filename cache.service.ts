// Cache Service for AI Personal Assistant
// Handles caching of weather and news data for better performance

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  weatherTTL: number; // Time to live for weather data (ms)
  newsTTL: number;    // Time to live for news data (ms)
  maxItems: number;   // Maximum number of items to cache
}

class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private config: CacheConfig = {
    weatherTTL: 10 * 60 * 1000,  // 10 minutes for weather
    newsTTL: 15 * 60 * 1000,     // 15 minutes for news
    maxItems: 50                  // Maximum 50 cached items
  };

  // Generate cache key
  private generateKey(type: 'weather' | 'news', identifier: string): string {
    return `${type}:${identifier.toLowerCase()}`;
  }

  // Set cache item
  set<T>(type: 'weather' | 'news', identifier: string, data: T): void {
    const key = this.generateKey(type, identifier);
    const ttl = type === 'weather' ? this.config.weatherTTL : this.config.newsTTL;
    const now = Date.now();

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };

    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxItems) {
      this.cleanup();
    }

    this.cache.set(key, cacheItem);
  }

  // Get cache item
  get<T>(type: 'weather' | 'news', identifier: string): T | null {
    const key = this.generateKey(type, identifier);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Check if item exists and is valid
  has(type: 'weather' | 'news', identifier: string): boolean {
    const key = this.generateKey(type, identifier);
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Remove specific cache item
  remove(type: 'weather' | 'news', identifier: string): boolean {
    const key = this.generateKey(type, identifier);
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Clear expired items
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    // If still too many items, remove oldest ones
    if (this.cache.size >= this.config.maxItems) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      const itemsToRemove = this.cache.size - this.config.maxItems + 10; // Remove extra 10
      for (let i = 0; i < itemsToRemove && i < sortedEntries.length; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }
  }

  // Get cache statistics
  getStats(): {
    totalItems: number;
    weatherItems: number;
    newsItems: number;
    expiredItems: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  } {
    const now = Date.now();
    let weatherItems = 0;
    let newsItems = 0;
    let expiredItems = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (const [key, item] of this.cache.entries()) {
      if (key.startsWith('weather:')) weatherItems++;
      if (key.startsWith('news:')) newsItems++;
      if (now > item.expiresAt) expiredItems++;

      if (item.timestamp < oldestTimestamp) oldestTimestamp = item.timestamp;
      if (item.timestamp > newestTimestamp) newestTimestamp = item.timestamp;
    }

    return {
      totalItems: this.cache.size,
      weatherItems,
      newsItems,
      expiredItems,
      oldestItem: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestItem: newestTimestamp === 0 ? null : new Date(newestTimestamp)
    };
  }

  // Get cache age for specific item
  getCacheAge(type: 'weather' | 'news', identifier: string): number | null {
    const key = this.generateKey(type, identifier);
    const item = this.cache.get(key);

    if (!item || Date.now() > item.expiresAt) {
      return null;
    }

    return Date.now() - item.timestamp;
  }

  // Get time until expiration
  getTimeUntilExpiration(type: 'weather' | 'news', identifier: string): number | null {
    const key = this.generateKey(type, identifier);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const timeLeft = item.expiresAt - Date.now();
    return timeLeft > 0 ? timeLeft : null;
  }

  // Update cache configuration
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get cache configuration
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  // Force refresh - remove item from cache to force fresh fetch
  forceRefresh(type: 'weather' | 'news', identifier: string): void {
    this.remove(type, identifier);
  }

  // Preload cache with data
  preload<T>(type: 'weather' | 'news', items: Array<{ identifier: string; data: T }>): void {
    items.forEach(item => {
      this.set(type, item.identifier, item.data);
    });
  }

  // Get all cached identifiers for a type
  getCachedIdentifiers(type: 'weather' | 'news'): string[] {
    const prefix = `${type}:`;
    const identifiers: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        identifiers.push(key.substring(prefix.length));
      }
    }

    return identifiers;
  }
}

export default new CacheService();
export type { CacheConfig };
