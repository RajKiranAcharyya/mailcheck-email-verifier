import { VerificationService } from '../src/services/verification.service';
import { DnsService } from '../src/services/dns.service';
import { DisposableDomainService } from '../src/services/disposable.service';
import { RoleService } from '../src/services/role.service';
import { TypoService } from '../src/services/typo.service';

describe('Risk Score and Verification Engine Tests', () => {
  let verificationService: VerificationService;
  let mockDns: Partial<DnsService>;
  let disposable: DisposableDomainService;
  let role: RoleService;
  let typo: TypoService;

  beforeEach(() => {
    mockDns = {
      checkMx: jest.fn().mockImplementation(async (domain: string) => {
        if (domain === 'nonexistent-bad-domain.xyz') {
          return { hasMx: false, records: [], cached: false, cacheLevel: 'none' };
        }
        return { hasMx: true, records: ['mail.' + domain], cached: true, cacheLevel: 'memory' };
      }),
    };
    disposable = new DisposableDomainService();
    role = new RoleService();
    typo = new TypoService();

    verificationService = new VerificationService(
      mockDns as DnsService,
      disposable,
      role,
      typo
    );
  });

  it('should mark clean business email with MX as valid with low risk score', async () => {
    const res = await verificationService.verify('sarah.connor@cyberdyne.org');
    expect(res.status).toBe('valid');
    expect(res.score).toBeLessThanOrEqual(25);
    expect(res.checks.syntax.valid).toBe(true);
    expect(res.checks.disposable.isDisposable).toBe(false);
    expect(res.checks.roleBased.isRole).toBe(false);
    expect(res.checks.mx.hasMx).toBe(true);
    expect(res.suggestion).toBeNull();
  });

  it('should mark disposable email as risky and flag isDisposable', async () => {
    const res = await verificationService.verify('testuser@mailinator.com');
    expect(res.checks.disposable.isDisposable).toBe(true);
    expect(res.status).toBe('risky');
    expect(res.score).toBeGreaterThan(50);
  });

  it('should flag role-based emails and increase score', async () => {
    const res = await verificationService.verify('support@company.com');
    expect(res.checks.roleBased.isRole).toBe(true);
    expect(res.checks.roleBased.role).toBe('support');
    expect(res.score).toBeGreaterThanOrEqual(25);
  });

  it('should detect domain typos, suggest correction and increase score', async () => {
    const res = await verificationService.verify('alex@icloudd.com');
    expect(res.suggestion).toBe('alex@icloud.com');
    expect(res.score).toBeGreaterThan(25);
    expect(res.status).toBe('risky');
  });

  it('should mark email with missing MX as invalid with high risk score', async () => {
    const res = await verificationService.verify('alex@nonexistent-bad-domain.xyz');
    expect(res.checks.mx.hasMx).toBe(false);
    expect(res.status).toBe('invalid');
    expect(res.score).toBeGreaterThanOrEqual(75);
  });

  it('should mark syntax-invalid email as invalid with max score 100', async () => {
    const res = await verificationService.verify('bad-email-without-at');
    expect(res.checks.syntax.valid).toBe(false);
    expect(res.status).toBe('invalid');
    expect(res.score).toBe(100);
  });
});
