import { VerificationService } from '../src/services/verification.service';

describe('Syntax Validation Tests', () => {
  let verificationService: VerificationService;

  beforeEach(() => {
    verificationService = new VerificationService();
  });

  it('should accept valid standard email addresses', () => {
    const validEmails = [
      'user@example.com',
      'john.doe@company.org',
      'developer123@tech.io',
      'first_last@domain.co.uk',
    ];

    for (const email of validEmails) {
      const result = verificationService.validateSyntax(email);
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.domain).toBeDefined();
    }
  });

  it('should accept emails with plus addressing / tags', () => {
    const result = verificationService.validateSyntax('user+newsletter@gmail.com');
    expect(result.valid).toBe(true);
    expect(result.user).toBe('user+newsletter');
    expect(result.domain).toBe('gmail.com');
  });

  it('should reject empty or null inputs', () => {
    expect(verificationService.validateSyntax('').valid).toBe(false);
    expect(verificationService.validateSyntax(null as any).valid).toBe(false);
    expect(verificationService.validateSyntax(undefined as any).valid).toBe(false);
  });

  it('should reject email missing @ symbol', () => {
    const result = verificationService.validateSyntax('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.details).toContain('@');
  });

  it('should reject email missing domain', () => {
    const result = verificationService.validateSyntax('user@');
    expect(result.valid).toBe(false);
  });

  it('should reject email missing username', () => {
    const result = verificationService.validateSyntax('@example.com');
    expect(result.valid).toBe(false);
  });

  it('should reject username exceeding 64 characters', () => {
    const longUser = 'a'.repeat(65);
    const result = verificationService.validateSyntax(`${longUser}@example.com`);
    expect(result.valid).toBe(false);
    expect(result.details).toContain('64');
  });

  it('should reject total email length exceeding 254 characters', () => {
    const longDomain = 'a'.repeat(60) + '.' + 'b'.repeat(60) + '.' + 'c'.repeat(60) + '.' + 'd'.repeat(60) + '.' + 'e'.repeat(15) + '.com';
    const result = verificationService.validateSyntax(`user@${longDomain}`);
    expect(result.valid).toBe(false);
    expect(result.details).toContain('254');
  });

  it('should reject email with consecutive dots', () => {
    expect(verificationService.validateSyntax('user..name@example.com').valid).toBe(false);
    expect(verificationService.validateSyntax('username@exam..ple.com').valid).toBe(false);
  });

  it('should reject invalid or single-letter TLD', () => {
    const result = verificationService.validateSyntax('user@domain.c');
    expect(result.valid).toBe(false);
    expect(result.details).toContain('TLD');
  });
});
