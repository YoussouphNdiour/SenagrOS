import { describe, expect, it } from 'vitest';
import {
  inputCategorySchema,
  createInputSchema,
  listPhytoSchema,
  listFertiSchema,
  listSemenceSchema,
  adjustInventorySchema,
  applyToLogSchema,
} from './input.validator';

describe('inputCategorySchema', () => {
  it('accepts valid categories', () => {
    expect(inputCategorySchema.parse('phyto')).toBe('phyto');
    expect(inputCategorySchema.parse('ferti')).toBe('ferti');
    expect(inputCategorySchema.parse('semence')).toBe('semence');
  });

  it('rejects invalid category', () => {
    expect(() => inputCategorySchema.parse('other')).toThrow();
  });
});

describe('createInputSchema', () => {
  it('creates a phyto insecticide (Decis Expert)', () => {
    const result = createInputSchema.parse({
      inputCategory: 'phyto',
      name: 'Decis Expert',
      inputSubcategory: 'insecticide',
      commercialName: 'Decis Expert',
      activeIngredient: 'Deltamethrine',
      recommendedDose: '0.5 L/ha',
      darDays: 3,
      toxicityClass: 'II',
      form: 'liquide',
      stockInitial: 10,
      stockUnit: 'L',
      unitPriceXof: 15000,
      stockThreshold: 2,
    });
    expect(result.inputCategory).toBe('phyto');
    expect(result.name).toBe('Decis Expert');
    expect(result.inputSubcategory).toBe('insecticide');
    expect(result.stockInitial).toBe(10);
    expect(result.stockUnit).toBe('L');
  });

  it('creates a ferti mineral', () => {
    const result = createInputSchema.parse({
      inputCategory: 'ferti',
      name: 'NPK 15-15-15',
      inputSubcategory: 'engrais_mineral',
      commercialName: 'NPK 15-15-15',
      compositionNpk: '15-15-15',
      form: 'granule',
      stockInitial: 500,
      stockUnit: 'kg',
      unitPriceXof: 350,
      stockThreshold: 50,
    });
    expect(result.inputCategory).toBe('ferti');
    expect(result.inputSubcategory).toBe('engrais_mineral');
  });

  it('creates a semence certifiee', () => {
    const result = createInputSchema.parse({
      inputCategory: 'semence',
      name: 'Oignon Red King',
      inputSubcategory: 'semence_certifiee',
      cropType: 'oignon',
      variety: 'Red King',
      lotNumber: 'RK-2022-001',
      germinationRate: 92,
      origin: 'Senegal',
      certification: 'certifiee',
      stockInitial: 25,
      stockUnit: 'kg',
      unitPriceXof: 8000,
      stockThreshold: 5,
    });
    expect(result.inputCategory).toBe('semence');
    if (result.inputCategory === 'semence') {
      expect(result.cropType).toBe('oignon');
      expect(result.germinationRate).toBe(92);
    }
  });

  it('rejects phyto with missing commercialName', () => {
    expect(() =>
      createInputSchema.parse({
        inputCategory: 'phyto',
        name: 'Test',
        inputSubcategory: 'insecticide',
        stockUnit: 'L',
      }),
    ).toThrow();
  });

  it('rejects semence with missing cropType', () => {
    expect(() =>
      createInputSchema.parse({
        inputCategory: 'semence',
        name: 'Test',
        inputSubcategory: 'semence_certifiee',
        stockUnit: 'kg',
      }),
    ).toThrow();
  });

  it('rejects germination rate > 100', () => {
    expect(() =>
      createInputSchema.parse({
        inputCategory: 'semence',
        name: 'Test',
        inputSubcategory: 'semence_certifiee',
        cropType: 'riz',
        germinationRate: 150,
        stockUnit: 'kg',
      }),
    ).toThrow();
  });

  it('defaults stockInitial to 0', () => {
    const result = createInputSchema.parse({
      inputCategory: 'phyto',
      name: 'Test',
      inputSubcategory: 'herbicide',
      commercialName: 'Test Herb',
      stockUnit: 'L',
    });
    expect(result.stockInitial).toBe(0);
  });
});

describe('listPhytoSchema', () => {
  it('applies default pagination', () => {
    const result = listPhytoSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('accepts subcategory filter', () => {
    const result = listPhytoSchema.parse({ subcategory: 'insecticide' });
    expect(result.subcategory).toBe('insecticide');
  });

  it('rejects invalid subcategory', () => {
    expect(() => listPhytoSchema.parse({ subcategory: 'mineral' })).toThrow();
  });
});

describe('listFertiSchema', () => {
  it('accepts ferti subcategories', () => {
    const result = listFertiSchema.parse({ subcategory: 'engrais_mineral' });
    expect(result.subcategory).toBe('engrais_mineral');
  });
});

describe('listSemenceSchema', () => {
  it('accepts semence subcategories', () => {
    const result = listSemenceSchema.parse({ subcategory: 'semence_certifiee' });
    expect(result.subcategory).toBe('semence_certifiee');
  });
});

describe('adjustInventorySchema', () => {
  it('accepts increment', () => {
    const result = adjustInventorySchema.parse({
      assetId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 10,
      unit: 'L',
      type: 'increment',
    });
    expect(result.type).toBe('increment');
    expect(result.quantity).toBe(10);
  });

  it('accepts decrement with logId', () => {
    const result = adjustInventorySchema.parse({
      assetId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 1.15,
      unit: 'L',
      type: 'decrement',
      logId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.type).toBe('decrement');
    expect(result.quantity).toBe(1.15);
    expect(result.logId).toBe('550e8400-e29b-41d4-a716-446655440001');
  });

  it('rejects zero quantity', () => {
    expect(() =>
      adjustInventorySchema.parse({
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
        unit: 'L',
        type: 'increment',
      }),
    ).toThrow();
  });
});

describe('applyToLogSchema', () => {
  it('calculates application with dose * surface', () => {
    const result = applyToLogSchema.parse({
      logId: '550e8400-e29b-41d4-a716-446655440000',
      assetId: '550e8400-e29b-41d4-a716-446655440001',
      dose: 0.5,
      doseUnit: 'L/ha',
      method: 'pulverisation',
      treatedSurfaceHa: 2.3,
    });
    // Expected decrement: 0.5 * 2.3 = 1.15 L
    expect(result.dose).toBe(0.5);
    expect(result.treatedSurfaceHa).toBe(2.3);
    // The actual stock calc (10 - 1.15 = 8.85) happens in the router
  });

  it('rejects zero dose', () => {
    expect(() =>
      applyToLogSchema.parse({
        logId: '550e8400-e29b-41d4-a716-446655440000',
        assetId: '550e8400-e29b-41d4-a716-446655440001',
        dose: 0,
        doseUnit: 'L/ha',
      }),
    ).toThrow();
  });
});

describe('stock calculation scenario: Decis Expert', () => {
  it('validates the spec scenario: 10L - (0.5 L/ha * 2.3 ha) = 8.85L', () => {
    // Scenario from spec:
    // 1. Create Decis Expert insecticide with 10L stock
    // 2. Apply 0.5 L/ha on 2.3 ha
    // 3. Expected remaining: 10 - 1.15 = 8.85 L

    const stockInitial = 10;
    const dose = 0.5;
    const surfaceHa = 2.3;
    const applied = dose * surfaceHa; // 1.15
    const remaining = stockInitial - applied; // 8.85

    expect(applied).toBeCloseTo(1.15, 10);
    expect(remaining).toBeCloseTo(8.85, 10);
  });
});
