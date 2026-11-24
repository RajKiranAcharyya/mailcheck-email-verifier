import { DisposableDomainService } from '../src/services/disposable.service';

describe('Disposable Email Domain Tests', () => {
  let disposableService: DisposableDomainService;

  beforeEach(() => {
    disposableService = new DisposableDomainService();
  });

  it('should identify popular disposable email services', () => {
    const knownDisposable = [
      'mailinator.com',
      'tempmail.com',
      'guerrillamail.com',
      '10minutemail.com',
      'throwawaymail.com',
      'yopmail.com',
      'sharklasers.com',
      'dispostable.com',
    ];

    for (const domain of knownDisposable) {
      expect(disposableService.isDisposable(domain)).toBe(true);
    }
  });

  it('should identify subdomains of disposable services', () => {
    expect(disposableService.isDisposable('sub.mailinator.com')).toBe(true);
    expect(disposableService.isDisposable('team.tempmail.com')).toBe(true);
  });

  it('should allow legitimate business and consumer domains', () => {
    const legitimate = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'microsoft.com',
      'google.com',
      'github.com',
      'apple.com',
    ];

    for (const domain of legitimate) {
      expect(disposableService.isDisposable(domain)).toBe(false);
    }
  });

  it('should handle uppercase and untrimmed domains', () => {
    expect(disposableService.isDisposable('  MAILINATOR.COM  ')).toBe(true);
  });

  it('should allow adding custom disposable domains dynamically', () => {
    const custom = 'my-custom-burner-domain.xyz';
    expect(disposableService.isDisposable(custom)).toBe(false);
    disposableService.addDomain(custom);
    expect(disposableService.isDisposable(custom)).toBe(true);
  });
});
