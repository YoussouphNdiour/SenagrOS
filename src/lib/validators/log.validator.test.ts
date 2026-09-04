import { describe, expect, it } from 'vitest';
import {
  logTypeSchema,
  logStatusSchema,
  seedingDataSchema,
  createLogSchema,
  quantityInputSchema,
  listLogsSchema,
} from './log.validator';

describe('logTypeSchema', () => {
  it('accepts valid log types', () => {
    expect(logTypeSchema.parse('activity')).toBe('activity');
    expect(logTypeSchema.parse('seeding')).toBe('seeding');
    expect(logTypeSchema.parse('harvest')).toBe('harvest');
    expect(logTypeSchema.parse('irrigation')).toBe('irrigation');
  });

  it('rejects invalid log type', () => {
    expect(() => logTypeSchema.parse('invalid')).toThrow();
  });
});

describe('logStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(logStatusSchema.parse('pending')).toBe('pending');
    expect(logStatusSchema.parse('done')).toBe('done');
    expect(logStatusSchema.parse('cancelled')).toBe('cancelled');
  });

  it('rejects invalid status', () => {
    expect(() => logStatusSchema.parse('active')).toThrow();
  });
});

describe('seedingDataSchema', () => {
  it('accepts manual seeding without machine_id', () => {
    const result = seedingDataSchema.parse({
      sowing_type: 'manual',
      seed_depth_cm: 3,
      row_spacing_cm: 75,
      plant_spacing_cm: 25,
    });
    expect(result.sowing_type).toBe('manual');
    expect(result.seed_depth_cm).toBe(3);
    expect(result.row_spacing_cm).toBe(75);
    expect(result.plant_spacing_cm).toBe(25);
  });

  it('accepts machine seeding with machine_id', () => {
    const result = seedingDataSchema.parse({
      sowing_type: 'machine',
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      seed_depth_cm: 3,
      row_spacing_cm: 75,
      plant_spacing_cm: 25,
      seed_rate_kg_ha: 120,
      seed_rate_unit: 'kg_ha',
    });
    expect(result.sowing_type).toBe('machine');
    expect(result.machine_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.seed_rate_kg_ha).toBe(120);
    expect(result.seed_rate_unit).toBe('kg_ha');
  });

  it('rejects machine seeding without machine_id', () => {
    expect(() =>
      seedingDataSchema.parse({
        sowing_type: 'machine',
        seed_depth_cm: 3,
      }),
    ).toThrow('machine_id is required');
  });

  it('accepts optional seed_id and target_parcel_id', () => {
    const result = seedingDataSchema.parse({
      sowing_type: 'manual',
      seed_id: '550e8400-e29b-41d4-a716-446655440001',
      target_parcel_id: '550e8400-e29b-41d4-a716-446655440002',
    });
    expect(result.seed_id).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.target_parcel_id).toBe('550e8400-e29b-41d4-a716-446655440002');
  });

  it('rejects negative seed_depth_cm', () => {
    expect(() =>
      seedingDataSchema.parse({
        sowing_type: 'manual',
        seed_depth_cm: -1,
      }),
    ).toThrow();
  });

  it('rejects zero row_spacing_cm', () => {
    expect(() =>
      seedingDataSchema.parse({
        sowing_type: 'manual',
        row_spacing_cm: 0,
      }),
    ).toThrow();
  });
});

describe('quantityInputSchema', () => {
  it('accepts valid quantity', () => {
    const result = quantityInputSchema.parse({
      measure: 'weight',
      numerator: 3500,
      unit: 'kg',
      label: 'poids récolté',
    });
    expect(result.measure).toBe('weight');
    expect(result.numerator).toBe(3500);
    expect(result.denominator).toBe(1); // default
    expect(result.unit).toBe('kg');
  });

  it('accepts inventory adjustment', () => {
    const result = quantityInputSchema.parse({
      measure: 'weight',
      numerator: 50,
      unit: 'kg',
      inventoryAdjustment: 'decrement',
      inventoryAssetId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.inventoryAdjustment).toBe('decrement');
    expect(result.inventoryAssetId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects invalid measure', () => {
    expect(() =>
      quantityInputSchema.parse({
        measure: 'invalid',
        numerator: 10,
        unit: 'kg',
      }),
    ).toThrow();
  });
});

describe('createLogSchema', () => {
  it('accepts a minimal log', () => {
    const result = createLogSchema.parse({
      type: 'activity',
      name: 'Désherbage parcelle Nord',
      timestamp: '2026-03-15T08:00',
    });
    expect(result.type).toBe('activity');
    expect(result.name).toBe('Désherbage parcelle Nord');
  });

  it('accepts a seeding log with full data', () => {
    const result = createLogSchema.parse({
      type: 'seeding',
      name: 'Semis haricot P-06',
      timestamp: '2026-03-14T07:30',
      status: 'done',
      data: {
        sowing_type: 'machine',
        machine_id: '550e8400-e29b-41d4-a716-446655440000',
        seed_depth_cm: 3,
        row_spacing_cm: 75,
        plant_spacing_cm: 25,
        seed_rate_kg_ha: 120,
      },
      equipmentIds: ['550e8400-e29b-41d4-a716-446655440000'],
      workerIds: ['550e8400-e29b-41d4-a716-446655440001'],
      quantities: [
        { measure: 'weight', numerator: 240, unit: 'kg', label: 'semence utilisée' },
      ],
    });
    expect(result.type).toBe('seeding');
    expect(result.equipmentIds).toHaveLength(1);
    expect(result.workerIds).toHaveLength(1);
    expect(result.quantities).toHaveLength(1);
  });

  it('accepts asset associations', () => {
    const result = createLogSchema.parse({
      type: 'harvest',
      name: 'Récolte oignon',
      timestamp: '2026-05-20T06:00',
      assetIds: [
        { assetId: '550e8400-e29b-41d4-a716-446655440000', role: 'subject' },
        { assetId: '550e8400-e29b-41d4-a716-446655440001', role: 'location' },
      ],
    });
    expect(result.assetIds).toHaveLength(2);
  });

  it('rejects empty name', () => {
    expect(() =>
      createLogSchema.parse({
        type: 'activity',
        name: '',
        timestamp: '2026-03-15T08:00',
      }),
    ).toThrow();
  });

  it('rejects invalid type', () => {
    expect(() =>
      createLogSchema.parse({
        type: 'unknown',
        name: 'Test',
        timestamp: '2026-03-15T08:00',
      }),
    ).toThrow();
  });
});

describe('listLogsSchema', () => {
  it('applies default pagination', () => {
    const result = listLogsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('accepts all filter options', () => {
    const result = listLogsSchema.parse({
      type: 'seeding',
      status: 'done',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      assetId: '550e8400-e29b-41d4-a716-446655440000',
      search: 'haricot',
      page: 2,
      limit: 50,
    });
    expect(result.type).toBe('seeding');
    expect(result.status).toBe('done');
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });
});
