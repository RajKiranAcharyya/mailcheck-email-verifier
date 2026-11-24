import { dnsService, DnsService } from './dns.service';
import { disposableService, DisposableDomainService } from './disposable.service';
import { roleService, RoleService } from './role.service';
import { typoService, TypoService } from './typo.service';
import { VerificationResult, EmailStatus } from '../types';

export class VerificationService {
  private dns: DnsService;
  private disposable: DisposableDomainService;
  private role: RoleService;
  private typo: TypoService;

  private freeDomains = new Set([
    'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'rocketmail.com',
    'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com',
    'mac.com', 'aol.com', 'zoho.com', 'proton.me', 'protonmail.com', 'gmx.com',
    'mail.com', 'yandex.com', 'yandex.ru'
  ]);

  constructor(
    dns: DnsService = dnsService,
    disposable: DisposableDomainService = disposableService,
    role: RoleService = roleService,
    typo: TypoService = typoService
  ) {
    this.dns = dns;
    this.disposable = disposable;
    this.role = role;
    this.typo = typo;
  }

  /**
   * Validates email syntax based on RFC 5322 rules.
   */
  validateSyntax(email: string): { valid: boolean; user: string; domain: string; details?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, user: '', domain: '', details: 'Email address cannot be empty' };
    }

    const trimmed = email.trim();
    if (trimmed.length > 254) {
      return { valid: false, user: '', domain: '', details: 'Total length exceeds 254 characters' };
    }

    const atIndex = trimmed.lastIndexOf('@');
    if (atIndex === -1 || atIndex === 0 || atIndex === trimmed.length - 1) {
      return { valid: false, user: '', domain: '', details: 'Missing or misplaced @ symbol' };
    }

    const user = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);

    if (user.length > 64) {
      return { valid: false, user, domain, details: 'Username exceeds 64 characters' };
    }

    // RFC syntax check regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, user, domain, details: 'Invalid character formatting in email' };
    }

    // Consecutive dots check
    if (user.includes('..') || domain.includes('..')) {
      return { valid: false, user, domain, details: 'Email contains consecutive dots' };
    }

    // TLD length check (at least 2 letters)
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
      return { valid: false, user, domain, details: 'Invalid top-level domain (TLD)' };
    }

    return { valid: true, user, domain };
  }

  /**
   * Complete email verification workflow.
   */
  async verify(emailInput: string, checkMxDns: boolean = true): Promise<VerificationResult> {
    const rawEmail = (emailInput || '').trim();
    const syntax = this.validateSyntax(rawEmail);

    if (!syntax.valid) {
      return {
        email: rawEmail,
        user: syntax.user || '',
        domain: syntax.domain || '',
        status: 'invalid',
        score: 100,
        checks: {
          syntax: { valid: false, details: syntax.details },
          disposable: { isDisposable: false },
          roleBased: { isRole: false },
          mx: { hasMx: false, records: [], cached: false, cacheLevel: 'none' },
          freeProvider: { isFree: false },
        },
        suggestion: null,
        processedAt: new Date().toISOString(),
      };
    }

    const user = syntax.user;
    const domain = syntax.domain.toLowerCase();
    const normalizedEmail = `${user}@${domain}`;

    // 1. Disposable check
    const isDisposable = this.disposable.isDisposable(domain);

    // 2. Role-based check
    const roleCheck = this.role.isRole(user);

    // 3. Typo suggestion
    const suggestion = this.typo.suggest(normalizedEmail);

    // 4. Free provider check
    const isFree = this.freeDomains.has(domain);

    // 5. MX check
    let mxCheck: {
      hasMx: boolean;
      records: string[];
      cached: boolean;
      cacheLevel?: 'memory' | 'database' | 'none';
    } = {
      hasMx: false,
      records: [] as string[],
      cached: false,
      cacheLevel: 'none',
    };

    if (checkMxDns) {
      mxCheck = await this.dns.checkMx(domain);
    } else {
      mxCheck = { hasMx: true, records: ['test.mx.example.com'], cached: false, cacheLevel: 'none' };
    }

    // 6. Calculate Risk Score (0-100)
    let score = 0;

    if (!mxCheck.hasMx) {
      score += 80;
    }

    if (isDisposable) {
      score += 70;
    }

    if (roleCheck.isRole) {
      score += 25;
    }

    if (suggestion !== null) {
      score += 30;
    }

    if (isFree) {
      score += 5;
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, score));

    // Determine status
    let status: EmailStatus = 'valid';
    if (!mxCheck.hasMx || score >= 75) {
      status = 'invalid';
    } else if (isDisposable || roleCheck.isRole || suggestion !== null || score >= 25) {
      status = 'risky';
    } else {
      status = 'valid';
    }

    return {
      email: normalizedEmail,
      user,
      domain,
      status,
      score,
      checks: {
        syntax: { valid: true },
        disposable: { isDisposable },
        roleBased: { isRole: roleCheck.isRole, role: roleCheck.role },
        mx: {
          hasMx: mxCheck.hasMx,
          records: mxCheck.records,
          cached: mxCheck.cached,
          cacheLevel: mxCheck.cacheLevel,
        },
        freeProvider: { isFree },
      },
      suggestion,
      processedAt: new Date().toISOString(),
    };
  }
}

export const verificationService = new VerificationService();
