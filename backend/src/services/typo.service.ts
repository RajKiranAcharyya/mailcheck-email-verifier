export class TypoService {
  private popularDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'zoho.com',
    'proton.me',
    'protonmail.com',
    'live.com',
    'msn.com',
    'yandex.com',
    'mail.com',
    'comcast.net',
    'verizon.net',
  ];

  /**
   * Calculates Levenshtein distance between two strings.
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Suggests a correction if a domain has a close typo match to a popular provider.
   */
  suggest(email: string): string | null {
    const parts = email.toLowerCase().trim().split('@');
    if (parts.length !== 2) return null;

    const [user, domain] = parts;
    if (this.popularDomains.includes(domain)) {
      return null; // Exact match, no typo
    }

    let closestDomain: string | null = null;
    let minDistance = 3; // Only consider distance 1 or 2

    for (const popDomain of this.popularDomains) {
      const dist = this.levenshteinDistance(domain, popDomain);
      if (dist > 0 && dist < minDistance) {
        minDistance = dist;
        closestDomain = popDomain;
      }
    }

    return closestDomain ? `${user}@${closestDomain}` : null;
  }
}

export const typoService = new TypoService();
