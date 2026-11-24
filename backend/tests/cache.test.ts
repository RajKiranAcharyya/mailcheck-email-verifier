import { db, runMigrations } from '../src/database/db';
import { DomainCacheService, DEFAULT_CACHE_TTL_MS } from '../src/services/cache.service';
import { DnsService } from '../src/services/dns.service';

describe('Two-Level Domain Cache Tests (Memory + SQLite, 24h TTL)', () => {
  let cacheService: DomainCacheService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await runMigrations();
  });

  beforeEach(async () => {
    cacheService = new DomainCacheService();
    await cacheService.clearAll();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should return null on cache miss', async () => {
    const res = await cacheService.get('unknown-domain.com');
    expect(res.entry).toBeNull();
    expect(res.cacheLevel).toBeUndefined();
  });

  it('should store in Level 1 (memory) and Level 2 (SQLite DB)', async () => {
    const domain = 'acme.com';
    const records = ['mail.acme.com'];

    await cacheService.set(domain, true, records);

    // Verify in memory
    expect(cacheService.getMemoryCacheSize()).toBe(1);

    // Verify in SQLite database
    const dbRow = await db('domain_cache').where({ domain }).first();
    expect(dbRow).toBeDefined();
    expect(dbRow.domain).toBe(domain);
    expect(Boolean(dbRow.has_mx)).toBe(true);
    expect(JSON.parse(dbRow.mx_records)).toEqual(records);
  });

  it('should hit Level 1 memory cache on immediate repeat lookup', async () => {
    const domain = 'google.com';
    await cacheService.set(domain, true, ['aspmx.l.google.com']);

    const res = await cacheService.get(domain);
    expect(res.entry).toBeDefined();
    expect(res.entry?.hasMx).toBe(true);
    expect(res.cacheLevel).toBe('memory');
  });

  it('should fall back to Level 2 SQLite cache when memory is wiped, and repopulate memory', async () => {
    const domain = 'fallback-test.org';
    const records = ['mx1.fallback-test.org'];

    // 1. Store in both caches
    await cacheService.set(domain, true, records);

    // 2. Clear ONLY Level 1 memory cache
    cacheService.clearMemoryCache();
    expect(cacheService.getMemoryCacheSize()).toBe(0);

    // 3. Lookup should hit Level 2 database cache
    const res = await cacheService.get(domain);
    expect(res.entry).toBeDefined();
    expect(res.entry?.domain).toBe(domain);
    expect(res.entry?.mxRecords).toEqual(records);
    expect(res.cacheLevel).toBe('database');

    // 4. Memory cache should now be repopulated
    expect(cacheService.getMemoryCacheSize()).toBe(1);

    // 5. Subsequent lookup should now hit Level 1 memory again
    const memRes = await cacheService.get(domain);
    expect(memRes.cacheLevel).toBe('memory');
  });

  it('should invalidate and ignore expired entries (>24h TTL)', async () => {
    const domain = 'expired-domain.com';

    // Store with negative TTL (already expired)
    await cacheService.set(domain, true, ['mx.expired.com'], -1000);

    const res = await cacheService.get(domain);
    expect(res.entry).toBeNull();

    // Check that it was purged from DB
    const dbRow = await db('domain_cache').where({ domain }).first();
    expect(dbRow).toBeUndefined();
  });

  it('should cut repeated DNS lookups via DnsService', async () => {
    const dnsService = new DnsService(cacheService);
    const domain = 'cached-dns.com';

    // Spy on lookupMxDns to count DNS calls
    const lookupSpy = jest
      .spyOn(dnsService, 'lookupMxDns')
      .mockResolvedValue({ hasMx: true, records: ['mx.cached-dns.com'] });

    // Call 1: Cache miss -> calls DNS lookup
    const firstCall = await dnsService.checkMx(domain);
    expect(firstCall.cached).toBe(false);
    expect(firstCall.hasMx).toBe(true);
    expect(lookupSpy).toHaveBeenCalledTimes(1);

    // Call 2: Level 1 memory cache hit -> 0 DNS calls
    const secondCall = await dnsService.checkMx(domain);
    expect(secondCall.cached).toBe(true);
    expect(secondCall.cacheLevel).toBe('memory');
    expect(lookupSpy).toHaveBeenCalledTimes(1);

    // Wipe memory cache to test Level 2 database cache hit
    cacheService.clearMemoryCache();

    // Call 3: Level 2 database cache hit -> 0 DNS calls
    const thirdCall = await dnsService.checkMx(domain);
    expect(thirdCall.cached).toBe(true);
    expect(thirdCall.cacheLevel).toBe('database');
    expect(lookupSpy).toHaveBeenCalledTimes(1);

    lookupSpy.mockRestore();
  });
});
