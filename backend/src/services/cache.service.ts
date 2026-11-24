import { db } from '../database/db';
import { DomainCacheEntry } from '../types';

export const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class DomainCacheService {
  private memoryCache = new Map<string, DomainCacheEntry>();

  /**
   * Retrieves domain MX cache entry checking Level 1 (Memory) then Level 2 (SQLite Database).
   */
  async get(domain: string): Promise<{ entry: DomainCacheEntry | null; cacheLevel?: 'memory' | 'database' }> {
    const normalizedDomain = domain.toLowerCase().trim();
    const now = Date.now();

    // 1. Level 1: In-Memory Cache
    const memEntry = this.memoryCache.get(normalizedDomain);
    if (memEntry) {
      if (memEntry.expiresAt > now) {
        return { entry: memEntry, cacheLevel: 'memory' };
      } else {
        // Expired in memory
        this.memoryCache.delete(normalizedDomain);
      }
    }

    // 2. Level 2: SQLite Database Cache
    try {
      const row = await db('domain_cache').where({ domain: normalizedDomain }).first();
      if (row) {
        const expiresAt = new Date(row.expires_at).getTime();
        if (expiresAt > now) {
          const entry: DomainCacheEntry = {
            domain: row.domain,
            hasMx: Boolean(row.has_mx),
            mxRecords: JSON.parse(row.mx_records || '[]'),
            expiresAt,
          };
          // Re-populate Level 1 memory cache
          this.memoryCache.set(normalizedDomain, entry);
          return { entry, cacheLevel: 'database' };
        } else {
          // Expired in DB, remove row
          await db('domain_cache').where({ domain: normalizedDomain }).del();
        }
      }
    } catch (err) {
      // In case database isn't ready or during isolated testing without migrations, log and continue
      console.error('Error reading from database cache:', err);
    }

    return { entry: null };
  }

  /**
   * Stores domain MX result into both Level 1 (Memory) and Level 2 (SQLite Database).
   */
  async set(
    domain: string,
    hasMx: boolean,
    mxRecords: string[],
    ttlMs: number = DEFAULT_CACHE_TTL_MS
  ): Promise<DomainCacheEntry> {
    const normalizedDomain = domain.toLowerCase().trim();
    const now = Date.now();
    const expiresAt = now + ttlMs;

    const entry: DomainCacheEntry = {
      domain: normalizedDomain,
      hasMx,
      mxRecords,
      expiresAt,
    };

    // Store in Level 1 (Memory)
    this.memoryCache.set(normalizedDomain, entry);

    // Store in Level 2 (SQLite DB) with atomic upsert
    try {
      const dbPayload = {
        domain: normalizedDomain,
        has_mx: hasMx ? 1 : 0,
        mx_records: JSON.stringify(mxRecords),
        created_at: new Date(now).toISOString(),
        expires_at: new Date(expiresAt).toISOString(),
      };

      await db('domain_cache').insert(dbPayload).onConflict('domain').merge();
    } catch (err) {
      console.error('Error saving to database cache:', err);
    }

    return entry;
  }

  /**
   * Clears the Level 1 in-memory cache.
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Clears the Level 2 database cache.
   */
  async clearDatabaseCache(): Promise<void> {
    await db('domain_cache').del();
  }

  /**
   * Clears both cache levels.
   */
  async clearAll(): Promise<void> {
    this.clearMemoryCache();
    await this.clearDatabaseCache();
  }

  /**
   * Removes expired rows from database.
   */
  async cleanExpired(): Promise<number> {
    const nowIso = new Date().toISOString();
    return db('domain_cache').where('expires_at', '<=', nowIso).del();
  }

  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }
}

export const domainCacheService = new DomainCacheService();
