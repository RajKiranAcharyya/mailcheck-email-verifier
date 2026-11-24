import dns from 'dns';
import { domainCacheService, DomainCacheService } from './cache.service';

export interface MxCheckResult {
  hasMx: boolean;
  records: string[];
  cached: boolean;
  cacheLevel?: 'memory' | 'database' | 'none';
}

export class DnsService {
  private cache: DomainCacheService;

  constructor(cacheService: DomainCacheService = domainCacheService) {
    this.cache = cacheService;
  }

  /**
   * Performs MX record lookup with 2-level caching (Memory + SQLite).
   */
  async checkMx(domain: string): Promise<MxCheckResult> {
    const normalizedDomain = domain.toLowerCase().trim();

    // 1. Check two-level cache
    const cached = await this.cache.get(normalizedDomain);
    if (cached.entry) {
      return {
        hasMx: cached.entry.hasMx,
        records: cached.entry.mxRecords,
        cached: true,
        cacheLevel: cached.cacheLevel,
      };
    }

    // 2. Cache miss: perform real DNS lookup
    const { hasMx, records } = await this.lookupMxDns(normalizedDomain);

    // 3. Store result in two-level cache (24h TTL)
    await this.cache.set(normalizedDomain, hasMx, records);

    return {
      hasMx,
      records,
      cached: false,
      cacheLevel: 'none',
    };
  }

  /**
   * Internal DNS lookup using node:dns promises.
   */
  async lookupMxDns(domain: string): Promise<{ hasMx: boolean; records: string[] }> {
    try {
      const mxRecords = await dns.promises.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        // Sort by priority ascending
        const sorted = [...mxRecords].sort((a, b) => a.priority - b.priority);
        return {
          hasMx: true,
          records: sorted.map((r) => r.exchange),
        };
      }
    } catch (err: any) {
      // If code is ENODATA or ENOTFOUND, try A record fallback per RFC 5321
      if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
        try {
          const aRecords = await dns.promises.resolve4(domain);
          if (aRecords && aRecords.length > 0) {
            return {
              hasMx: true,
              records: [domain], // Domain acts as implicit MX
            };
          }
        } catch {
          // No A record either
        }
      }
    }

    return {
      hasMx: false,
      records: [],
    };
  }
}

export const dnsService = new DnsService();
