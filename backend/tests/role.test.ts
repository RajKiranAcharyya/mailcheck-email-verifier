import { RoleService } from '../src/services/role.service';

describe('Role-Based Email Detection Tests', () => {
  let roleService: RoleService;

  beforeEach(() => {
    roleService = new RoleService();
  });

  it('should detect standard role-based user names', () => {
    const roles = ['admin', 'support', 'sales', 'billing', 'info', 'help', 'contact', 'hr', 'careers'];

    for (const r of roles) {
      const res = roleService.isRole(r);
      expect(res.isRole).toBe(true);
      expect(res.role).toBe(r);
    }
  });

  it('should detect no-reply and notification addresses', () => {
    expect(roleService.isRole('no-reply').isRole).toBe(true);
    expect(roleService.isRole('noreply').isRole).toBe(true);
    expect(roleService.isRole('notifications').isRole).toBe(true);
  });

  it('should detect compound role names', () => {
    expect(roleService.isRole('support-team').isRole).toBe(true);
    expect(roleService.isRole('admin.corp').isRole).toBe(true);
    expect(roleService.isRole('billing_dept').isRole).toBe(true);
  });

  it('should not flag personal email addresses as roles', () => {
    const personalUsers = ['alex', 'raj.kiran', 'sarah_m', 'john.doe', 'bruce.wayne'];

    for (const u of personalUsers) {
      expect(roleService.isRole(u).isRole).toBe(false);
    }
  });
});
