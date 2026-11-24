import fs from 'fs';
import path from 'path';

export class DisposableDomainService {
  private disposableSet: Set<string> = new Set();
  private isLoaded: boolean = false;

  constructor() {
    this.loadDomains();
  }

  private loadDomains(): void {
    const defaultCandidates = [
      path.resolve(__dirname, '../../data/disposable_domains.txt'),
      path.resolve(__dirname, '../data/disposable_domains.txt'),
      path.resolve(process.cwd(), 'data/disposable_domains.txt'),
      path.resolve(process.cwd(), 'backend/data/disposable_domains.txt'),
    ];

    // Always seed baseline common disposable domains
    const baseCommon = [
      'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
      'throwawaymail.com', 'trashmail.com', 'yopmail.com', 'sharklasers.com',
      'dispostable.com', 'getairmail.com', 'mytemp.email', 'temp-mail.org',
      'generator.email', 'emailondeck.com', 'fakeinbox.com', 'maildrop.cc'
    ];
    for (const d of baseCommon) {
      this.disposableSet.add(d);
    }

    for (const filePath of defaultCandidates) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim().toLowerCase();
            if (trimmed && !trimmed.startsWith('#')) {
              this.disposableSet.add(trimmed);
            }
          }
          this.isLoaded = true;
          break;
        } catch (err) {
          console.error(`Failed to read disposable domains from ${filePath}:`, err);
        }
      }
    }

    // Default fallback domains if file not loaded
    if (this.disposableSet.size === 0) {
      const fallbackDomains = [
        'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
        'throwawaymail.com', 'trashmail.com', 'yopmail.com', 'sharklasers.com',
        'dispostable.com', 'getairmail.com', 'mytemp.email', 'temp-mail.org',
        'generator.email', 'emailondeck.com', 'fakeinbox.com', 'maildrop.cc'
      ];
      for (const d of fallbackDomains) {
        this.disposableSet.add(d);
      }
      this.isLoaded = true;
    }
  }

  /**
   * Checks if a domain is a disposable email service.
   */
  isDisposable(domain: string): boolean {
    const cleanDomain = domain.toLowerCase().trim();
    if (this.disposableSet.has(cleanDomain)) {
      return true;
    }

    // Check parent domains (e.g. foo.bar.mailinator.com -> mailinator.com)
    const parts = cleanDomain.split('.');
    while (parts.length > 2) {
      parts.shift();
      const parentDomain = parts.join('.');
      if (this.disposableSet.has(parentDomain)) {
        return true;
      }
    }

    return false;
  }

  getDomainCount(): number {
    return this.disposableSet.size;
  }

  addDomain(domain: string): void {
    this.disposableSet.add(domain.toLowerCase().trim());
  }
}

export const disposableService = new DisposableDomainService();
