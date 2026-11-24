export class RoleService {
  private rolePrefixes = new Set([
    'admin',
    'administrator',
    'webmaster',
    'hostmaster',
    'postmaster',
    'root',
    'support',
    'help',
    'info',
    'sales',
    'marketing',
    'billing',
    'contact',
    'enquiry',
    'feedback',
    'jobs',
    'careers',
    'hr',
    'recruiting',
    'press',
    'media',
    'security',
    'legal',
    'compliance',
    'privacy',
    'office',
    'team',
    'staff',
    'general',
    'mail',
    'orders',
    'service',
    'services',
    'tech',
    'dev',
    'operations',
    'ops',
    'no-reply',
    'noreply',
    'mailer-daemon',
    'notifications',
    'alerts',
  ]);

  /**
   * Checks if an email username represents a role-based or generic departmental mailbox.
   */
  isRole(username: string): { isRole: boolean; role?: string } {
    const cleanUser = username.toLowerCase().trim();

    // Check exact match
    if (this.rolePrefixes.has(cleanUser)) {
      return { isRole: true, role: cleanUser };
    }

    // Check prefixed roles like support-team, info.uk, admin1, etc.
    for (const role of this.rolePrefixes) {
      if (
        cleanUser.startsWith(`${role}-`) ||
        cleanUser.startsWith(`${role}.`) ||
        cleanUser.startsWith(`${role}_`) ||
        cleanUser.startsWith(`${role}+`)
      ) {
        return { isRole: true, role };
      }
    }

    return { isRole: false };
  }
}

export const roleService = new RoleService();
