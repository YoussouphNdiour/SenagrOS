import { describe, expect, it } from 'vitest';
import {
  cooperativeRoleEnum,
  cooperativeRoleLabels,
  cooperativeTypeEnum,
  cooperativeTypeLabels,
  createCooperativeSchema,
  updateCooperativeSchema,
  cooperativeIdSchema,
  inviteToCooperativeSchema,
  acceptInvitationSchema,
  listCooperativesSchema,
  cooperativeDashboardSchema,
} from './cooperative.validator';

// --- Enums ---

describe('cooperativeRoleEnum', () => {
  it('accepts valid roles', () => {
    expect(cooperativeRoleEnum.parse('admin')).toBe('admin');
    expect(cooperativeRoleEnum.parse('member')).toBe('member');
  });

  it('rejects invalid role', () => {
    expect(() => cooperativeRoleEnum.parse('superadmin')).toThrow();
  });
});

describe('cooperativeTypeEnum', () => {
  it('accepts valid types', () => {
    expect(cooperativeTypeEnum.parse('cooperative')).toBe('cooperative');
    expect(cooperativeTypeEnum.parse('gie')).toBe('gie');
    expect(cooperativeTypeEnum.parse('association')).toBe('association');
    expect(cooperativeTypeEnum.parse('union')).toBe('union');
  });

  it('rejects invalid type', () => {
    expect(() => cooperativeTypeEnum.parse('syndicat')).toThrow();
  });
});

// --- Labels ---

describe('cooperativeRoleLabels', () => {
  it('has a label for every role', () => {
    expect(cooperativeRoleLabels.admin).toBe('Administrateur');
    expect(cooperativeRoleLabels.member).toBe('Membre');
  });
});

describe('cooperativeTypeLabels', () => {
  it('has a label for every type', () => {
    expect(cooperativeTypeLabels.cooperative).toBe('Coopérative');
    expect(cooperativeTypeLabels.gie).toBe('GIE');
    expect(cooperativeTypeLabels.association).toBe('Association');
    expect(cooperativeTypeLabels.union).toBe('Union');
  });
});

// --- createCooperativeSchema ---

describe('createCooperativeSchema', () => {
  it('accepts a valid cooperative', () => {
    const result = createCooperativeSchema.parse({
      name: 'Coopérative de Saint-Louis',
      description: 'Regroupement des fermes du nord',
      region: 'Saint-Louis',
      type: 'cooperative',
    });
    expect(result.name).toBe('Coopérative de Saint-Louis');
    expect(result.type).toBe('cooperative');
  });

  it('applies default type if not provided', () => {
    const result = createCooperativeSchema.parse({ name: 'Test Coop' });
    expect(result.type).toBe('cooperative');
  });

  it('rejects a name with less than 2 characters', () => {
    expect(() => createCooperativeSchema.parse({ name: 'A' })).toThrow();
  });

  it('accepts GIE type', () => {
    const result = createCooperativeSchema.parse({
      name: 'GIE Niayes',
      type: 'gie',
    });
    expect(result.type).toBe('gie');
  });

  it('rejects invalid type', () => {
    expect(() =>
      createCooperativeSchema.parse({ name: 'Test', type: 'unknown' }),
    ).toThrow();
  });
});

// --- updateCooperativeSchema ---

describe('updateCooperativeSchema', () => {
  const validId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  it('accepts partial update', () => {
    const result = updateCooperativeSchema.parse({
      id: validId,
      name: 'Nouveau nom',
    });
    expect(result.id).toBe(validId);
    expect(result.name).toBe('Nouveau nom');
  });

  it('rejects invalid uuid', () => {
    expect(() =>
      updateCooperativeSchema.parse({ id: 'not-a-uuid', name: 'Test' }),
    ).toThrow();
  });
});

// --- cooperativeIdSchema ---

describe('cooperativeIdSchema', () => {
  it('accepts valid uuid', () => {
    const result = cooperativeIdSchema.parse({
      cooperativeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(result.cooperativeId).toBeDefined();
  });

  it('rejects missing cooperativeId', () => {
    expect(() => cooperativeIdSchema.parse({})).toThrow();
  });
});

// --- inviteToCooperativeSchema ---

describe('inviteToCooperativeSchema', () => {
  it('accepts valid invitation', () => {
    const result = inviteToCooperativeSchema.parse({
      cooperativeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      farmId: 'f1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(result.cooperativeId).toBeDefined();
    expect(result.farmId).toBeDefined();
  });

  it('rejects missing farmId', () => {
    expect(() =>
      inviteToCooperativeSchema.parse({
        cooperativeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      }),
    ).toThrow();
  });
});

// --- acceptInvitationSchema ---

describe('acceptInvitationSchema', () => {
  it('accepts valid token', () => {
    const result = acceptInvitationSchema.parse({
      token: 'abc123def456',
    });
    expect(result.token).toBe('abc123def456');
  });

  it('rejects empty token', () => {
    expect(() => acceptInvitationSchema.parse({ token: '' })).toThrow();
  });
});

// --- listCooperativesSchema ---

describe('listCooperativesSchema', () => {
  it('applies default page and limit', () => {
    const result = listCooperativesSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('accepts custom page and limit', () => {
    const result = listCooperativesSchema.parse({ page: 3, limit: 10 });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });

  it('accepts search filter', () => {
    const result = listCooperativesSchema.parse({ search: 'Saint-Louis' });
    expect(result.search).toBe('Saint-Louis');
  });

  it('rejects limit > 100', () => {
    expect(() => listCooperativesSchema.parse({ limit: 200 })).toThrow();
  });
});

// --- cooperativeDashboardSchema ---

describe('cooperativeDashboardSchema', () => {
  it('accepts valid cooperativeId', () => {
    const result = cooperativeDashboardSchema.parse({
      cooperativeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(result.cooperativeId).toBeDefined();
  });
});

// --- Scenario: Coopérative de Saint-Louis ---

describe('Scenario: Coopérative de Saint-Louis', () => {
  it('creates a cooperative, invites a farm, and views dashboard', () => {
    // Step 1: Create cooperative
    const coop = createCooperativeSchema.parse({
      name: 'Coopérative Agricole de Saint-Louis',
      description: 'Regroupement de 12 fermes maraîchères du nord Sénégal',
      region: 'Saint-Louis',
      type: 'cooperative',
    });
    expect(coop.name).toBe('Coopérative Agricole de Saint-Louis');
    expect(coop.region).toBe('Saint-Louis');

    // Step 2: Invite a farm
    const invite = inviteToCooperativeSchema.parse({
      cooperativeId: 'c0000000-0000-4000-a000-000000000001',
      farmId: 'f0000000-0000-4000-a000-000000000002',
    });
    expect(invite.farmId).toBeDefined();

    // Step 3: Accept invitation
    const accept = acceptInvitationSchema.parse({
      token: '64char-hex-token-from-crypto-randomBytes',
    });
    expect(accept.token).toBeTruthy();

    // Step 4: View dashboard
    const dash = cooperativeDashboardSchema.parse({
      cooperativeId: 'c0000000-0000-4000-a000-000000000001',
    });
    expect(dash.cooperativeId).toBeDefined();
  });
});
