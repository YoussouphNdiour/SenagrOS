import { describe, expect, it } from 'vitest';
import {
  createPlanSchema,
  updatePlanSchema,
  planIdSchema,
  planLogSchema,
  listPlansSchema,
  planTypeEnum,
  planStatusEnum,
  planTypeLabels,
  planStatusLabels,
  seasonLabels,
} from './plan.validator';

describe('planTypeEnum', () => {
  it('accepts valid types', () => {
    expect(planTypeEnum.parse('crop')).toBe('crop');
    expect(planTypeEnum.parse('grazing')).toBe('grazing');
    expect(planTypeEnum.parse('harvest')).toBe('harvest');
  });

  it('rejects invalid type', () => {
    expect(() => planTypeEnum.parse('invalid')).toThrow();
  });
});

describe('planStatusEnum', () => {
  it('accepts valid statuses', () => {
    expect(planStatusEnum.parse('active')).toBe('active');
    expect(planStatusEnum.parse('completed')).toBe('completed');
    expect(planStatusEnum.parse('cancelled')).toBe('cancelled');
  });

  it('rejects invalid status', () => {
    expect(() => planStatusEnum.parse('unknown')).toThrow();
  });
});

describe('createPlanSchema', () => {
  it('creates a valid crop plan', () => {
    const result = createPlanSchema.parse({
      name: 'Campagne Hivernage 2026',
      type: 'crop',
      season: 'hivernage',
      startDate: '2026-06-01',
      endDate: '2026-10-31',
      notes: 'Plan principal pour la saison des pluies',
    });
    expect(result.name).toBe('Campagne Hivernage 2026');
    expect(result.type).toBe('crop');
    expect(result.season).toBe('hivernage');
  });

  it('creates a minimal plan (name + type only)', () => {
    const result = createPlanSchema.parse({
      name: 'Plan récolte',
      type: 'harvest',
    });
    expect(result.name).toBe('Plan récolte');
    expect(result.type).toBe('harvest');
    expect(result.season).toBeUndefined();
    expect(result.startDate).toBeUndefined();
  });

  it('rejects empty name', () => {
    expect(() =>
      createPlanSchema.parse({ name: '', type: 'crop' }),
    ).toThrow();
  });

  it('rejects missing type', () => {
    expect(() =>
      createPlanSchema.parse({ name: 'Test' }),
    ).toThrow();
  });

  it('rejects invalid type', () => {
    expect(() =>
      createPlanSchema.parse({ name: 'Test', type: 'fishing' }),
    ).toThrow();
  });

  it('enforces max name length of 255', () => {
    expect(() =>
      createPlanSchema.parse({ name: 'x'.repeat(256), type: 'crop' }),
    ).toThrow();
  });
});

describe('updatePlanSchema', () => {
  it('updates with partial fields', () => {
    const result = updatePlanSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Campagne mise à jour',
      status: 'completed',
    });
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.name).toBe('Campagne mise à jour');
    expect(result.status).toBe('completed');
  });

  it('requires valid uuid for id', () => {
    expect(() =>
      updatePlanSchema.parse({ id: 'not-a-uuid', name: 'Test' }),
    ).toThrow();
  });
});

describe('planIdSchema', () => {
  it('accepts valid uuid', () => {
    const result = planIdSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects invalid uuid', () => {
    expect(() => planIdSchema.parse({ id: '123' })).toThrow();
  });
});

describe('planLogSchema', () => {
  it('accepts valid plan-log association', () => {
    const result = planLogSchema.parse({
      planId: '550e8400-e29b-41d4-a716-446655440000',
      logId: '660e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.planId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.logId).toBe('660e8400-e29b-41d4-a716-446655440001');
  });

  it('rejects non-uuid planId', () => {
    expect(() =>
      planLogSchema.parse({ planId: 'bad', logId: '660e8400-e29b-41d4-a716-446655440001' }),
    ).toThrow();
  });
});

describe('listPlansSchema', () => {
  it('applies defaults', () => {
    const result = listPlansSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
    expect(result.type).toBeUndefined();
    expect(result.status).toBeUndefined();
  });

  it('accepts filters', () => {
    const result = listPlansSchema.parse({
      type: 'crop',
      status: 'active',
      search: 'hivernage',
      page: 2,
      limit: 10,
    });
    expect(result.type).toBe('crop');
    expect(result.status).toBe('active');
    expect(result.search).toBe('hivernage');
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it('rejects limit > 100', () => {
    expect(() => listPlansSchema.parse({ limit: 200 })).toThrow();
  });
});

describe('labels', () => {
  it('has labels for all plan types', () => {
    expect(Object.keys(planTypeLabels)).toEqual(['crop', 'grazing', 'harvest']);
  });

  it('has labels for all plan statuses', () => {
    expect(Object.keys(planStatusLabels)).toEqual(['active', 'completed', 'cancelled']);
  });

  it('has labels for all seasons', () => {
    expect(Object.keys(seasonLabels)).toEqual([
      'hivernage',
      'contre_saison_chaude',
      'contre_saison_froide',
    ]);
  });
});

describe('scenario: Campagne Hivernage 2026', () => {
  it('creates a full plan with all fields', () => {
    const plan = createPlanSchema.parse({
      name: 'Campagne Hivernage 2026',
      type: 'crop',
      season: 'hivernage',
      startDate: '2026-06-01',
      endDate: '2026-10-31',
      notes: 'Objectif: 3 parcelles haricot vert + 2 parcelles oignon',
    });

    expect(plan.name).toBe('Campagne Hivernage 2026');
    expect(plan.type).toBe('crop');
    expect(plan.season).toBe('hivernage');
    expect(plan.startDate).toBe('2026-06-01');
    expect(plan.endDate).toBe('2026-10-31');
    expect(plan.notes).toContain('3 parcelles haricot vert');

    // Simulate adding 3 logs (valid v4 UUIDs)
    const planUuid = '550e8400-e29b-41d4-a716-446655440000';
    const logIds = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003',
    ];
    for (const logId of logIds) {
      const assoc = planLogSchema.parse({ planId: planUuid, logId });
      expect(assoc.logId).toBe(logId);
    }

    // Simulate progression: 2 done out of 3
    const doneCount = 2;
    const totalCount = 3;
    const progressPct = Math.round((doneCount / totalCount) * 100);
    expect(progressPct).toBe(67);
  });
});
