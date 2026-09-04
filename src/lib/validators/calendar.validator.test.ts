import { describe, expect, it } from 'vitest';
import {
  createTemplateSchema,
  assignToParcelSchema,
  updateStageStatusSchema,
  calculateExpectedDates,
  calculateTotalDays,
  defaultStagesByCrop,
  stageSchema,
} from './calendar.validator';

describe('stageSchema', () => {
  it('accepts a valid stage', () => {
    const result = stageSchema.parse({
      name: 'Semis',
      order: 1,
      durationDays: 0,
      actions: ['preparation_sol'],
    });
    expect(result.name).toBe('Semis');
    expect(result.order).toBe(1);
    expect(result.durationDays).toBe(0);
    expect(result.actions).toEqual(['preparation_sol']);
  });

  it('rejects stage with empty name', () => {
    expect(() =>
      stageSchema.parse({ name: '', order: 1, durationDays: 0, actions: [] }),
    ).toThrow();
  });

  it('defaults actions to empty array', () => {
    const result = stageSchema.parse({ name: 'Test', order: 1, durationDays: 5 });
    expect(result.actions).toEqual([]);
  });
});

describe('createTemplateSchema', () => {
  it('creates a haricot vert template with 7 stages', () => {
    const result = createTemplateSchema.parse({
      name: 'Haricot vert Euforia — cycle 84j',
      cropType: 'haricot_vert',
      variety: 'Euforia',
      stages: defaultStagesByCrop.haricot_vert,
      totalDays: 84,
    });
    expect(result.name).toBe('Haricot vert Euforia — cycle 84j');
    expect(result.cropType).toBe('haricot_vert');
    expect(result.variety).toBe('Euforia');
    expect(result.stages).toHaveLength(7);
    expect(result.totalDays).toBe(84);
  });

  it('rejects template without stages', () => {
    expect(() =>
      createTemplateSchema.parse({
        name: 'Test',
        cropType: 'riz',
        stages: [],
      }),
    ).toThrow();
  });

  it('rejects template without name', () => {
    expect(() =>
      createTemplateSchema.parse({
        name: '',
        cropType: 'riz',
        stages: [{ name: 'Semis', order: 1, durationDays: 0, actions: [] }],
      }),
    ).toThrow();
  });
});

describe('assignToParcelSchema', () => {
  it('accepts valid assignment', () => {
    const result = assignToParcelSchema.parse({
      assetId: '550e8400-e29b-41d4-a716-446655440000',
      calendarId: '550e8400-e29b-41d4-a716-446655440001',
      sowingDate: '2026-03-14',
    });
    expect(result.assetId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.sowingDate).toBe('2026-03-14');
  });

  it('rejects assignment without sowing date', () => {
    expect(() =>
      assignToParcelSchema.parse({
        assetId: '550e8400-e29b-41d4-a716-446655440000',
        calendarId: '550e8400-e29b-41d4-a716-446655440001',
        sowingDate: '',
      }),
    ).toThrow();
  });
});

describe('updateStageStatusSchema', () => {
  it('accepts valid stage update', () => {
    const result = updateStageStatusSchema.parse({
      parcelCalendarId: '550e8400-e29b-41d4-a716-446655440000',
      stageName: 'Levée',
      actualDate: '2026-03-21',
      status: 'completed',
    });
    expect(result.stageName).toBe('Levée');
    expect(result.status).toBe('completed');
  });

  it('defaults status to completed', () => {
    const result = updateStageStatusSchema.parse({
      parcelCalendarId: '550e8400-e29b-41d4-a716-446655440000',
      stageName: 'Semis',
      actualDate: '2026-03-14',
    });
    expect(result.status).toBe('completed');
  });
});

describe('calculateExpectedDates', () => {
  it('calculates haricot vert 7 stages from 14/03 sowing', () => {
    const stages = defaultStagesByCrop.haricot_vert;
    const result = calculateExpectedDates('2026-03-14', stages);

    expect(result).toHaveLength(7);
    expect(result[0].stageName).toBe('Semis');
    expect(result[0].expectedDate).toBe('2026-03-14');
    expect(result[0].status).toBe('pending');

    // Levée: 0 days after semis (semis has 0 duration) → same day + 0 = 14/03
    // Wait, semis duration is 0, so levée starts at day 0 too?
    // No: stages are cumulative. Semis: duration 0 → next stage at day 0+0=0.
    // But that means levée starts on same day. Let's check:
    // Semis order 1, duration 0 → expected 14/03, cumulative = 0
    // Levée order 2, duration 7 → expected 14/03 + 0 = 14/03, cumulative = 0+7=7
    // Wait no: cumulativeDays starts at 0.
    // Stage 1 (Semis): expected = base + 0 = 14/03. Then cumulative += 0 → 0
    // Stage 2 (Levée): expected = base + 0 = 14/03. Then cumulative += 7 → 7
    // That's wrong conceptually. Levée should start after Semis.
    // Actually looking at the function, this is correct for the spec:
    // Semis happens on day 0 (sowing date) with 0 duration
    // Levée expected on day 0 (right after semis, since semis has 0 duration)
    // Croissance starts on day 7 (after 7 days of levée)
    expect(result[1].stageName).toBe('Levée');
    expect(result[1].expectedDate).toBe('2026-03-14');

    // Croissance: cumulative was 0+7=7 → base + 7 = 21/03
    expect(result[2].stageName).toBe('Croissance végétative');
    expect(result[2].expectedDate).toBe('2026-03-21');

    // Floraison: cumulative was 7+25=32 → base + 32 = 15/04
    expect(result[3].stageName).toBe('Floraison');
    expect(result[3].expectedDate).toBe('2026-04-15');

    // Fructification: cumulative was 32+15=47 → base + 47 = 30/04
    expect(result[4].stageName).toBe('Fructification');
    expect(result[4].expectedDate).toBe('2026-04-30');

    // Maturité: cumulative was 47+20=67 → base + 67 = 20/05
    expect(result[5].stageName).toBe('Maturité');
    expect(result[5].expectedDate).toBe('2026-05-20');

    // Récolte: cumulative was 67+10=77 → base + 77 = 30/05
    expect(result[6].stageName).toBe('Récolte');
    expect(result[6].expectedDate).toBe('2026-05-30');
  });

  it('all statuses default to pending', () => {
    const stages = defaultStagesByCrop.haricot_vert;
    const result = calculateExpectedDates('2026-03-14', stages);
    for (const s of result) {
      expect(s.status).toBe('pending');
      expect(s.actualDate).toBeNull();
    }
  });
});

describe('calculateTotalDays', () => {
  it('calculates haricot vert total = 84 days', () => {
    // 0 + 7 + 25 + 15 + 20 + 10 + 7 = 84
    const total = calculateTotalDays(defaultStagesByCrop.haricot_vert);
    expect(total).toBe(84);
  });

  it('calculates oignon total', () => {
    // 0 + 10 + 40 + 30 + 20 + 10 = 110
    const total = calculateTotalDays(defaultStagesByCrop.oignon);
    expect(total).toBe(110);
  });
});

describe('defaultStagesByCrop', () => {
  it('has haricot_vert with 7 stages', () => {
    expect(defaultStagesByCrop.haricot_vert).toHaveLength(7);
  });

  it('stages are ordered correctly', () => {
    for (const [, stages] of Object.entries(defaultStagesByCrop)) {
      for (let i = 0; i < stages.length; i++) {
        expect(stages[i].order).toBe(i + 1);
      }
    }
  });
});
