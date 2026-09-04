import { describe, expect, it } from 'vitest';
import {
  dashboardInputSchema,
  reportFilterSchema,
  harvestReportSchema,
  financialsReportSchema,
} from './report.validator';

describe('dashboardInputSchema', () => {
  it('accepts undefined (no input needed)', () => {
    const result = dashboardInputSchema.parse(undefined);
    expect(result).toBeUndefined();
  });

  it('accepts empty object', () => {
    const result = dashboardInputSchema.parse({});
    expect(result).toEqual({});
  });
});

describe('reportFilterSchema', () => {
  it('accepts empty object (no filters)', () => {
    const result = reportFilterSchema.parse({});
    expect(result.type).toBeUndefined();
    expect(result.dateFrom).toBeUndefined();
    expect(result.dateTo).toBeUndefined();
  });

  it('accepts type filter', () => {
    const result = reportFilterSchema.parse({ type: 'land' });
    expect(result.type).toBe('land');
  });

  it('accepts date range', () => {
    const result = reportFilterSchema.parse({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });
    expect(result.dateFrom).toBe('2026-01-01');
    expect(result.dateTo).toBe('2026-12-31');
  });

  it('accepts all filters combined', () => {
    const result = reportFilterSchema.parse({
      type: 'plant',
      dateFrom: '2026-06-01',
      dateTo: '2026-10-31',
    });
    expect(result.type).toBe('plant');
    expect(result.dateFrom).toBe('2026-06-01');
    expect(result.dateTo).toBe('2026-10-31');
  });
});

describe('harvestReportSchema', () => {
  it('accepts empty object', () => {
    const result = harvestReportSchema.parse({});
    expect(result.season).toBeUndefined();
  });

  it('accepts season filter', () => {
    const result = harvestReportSchema.parse({ season: 'hivernage' });
    expect(result.season).toBe('hivernage');
  });

  it('accepts date range', () => {
    const result = harvestReportSchema.parse({
      dateFrom: '2026-06-01',
      dateTo: '2026-10-31',
    });
    expect(result.dateFrom).toBe('2026-06-01');
    expect(result.dateTo).toBe('2026-10-31');
  });

  it('accepts all filters', () => {
    const result = harvestReportSchema.parse({
      season: 'contre_saison_chaude',
      dateFrom: '2026-03-01',
      dateTo: '2026-06-30',
    });
    expect(result.season).toBe('contre_saison_chaude');
    expect(result.dateFrom).toBe('2026-03-01');
  });
});

describe('financialsReportSchema', () => {
  it('accepts empty object', () => {
    const result = financialsReportSchema.parse({});
    expect(result.dateFrom).toBeUndefined();
  });

  it('accepts date range', () => {
    const result = financialsReportSchema.parse({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });
    expect(result.dateFrom).toBe('2026-01-01');
    expect(result.dateTo).toBe('2026-12-31');
  });
});

describe('scenario: rapport patrimoine hivernage 2026', () => {
  it('validates a typical asset report filter', () => {
    const filter = reportFilterSchema.parse({
      type: 'plant',
      dateFrom: '2026-06-01',
      dateTo: '2026-10-31',
    });
    expect(filter.type).toBe('plant');
    expect(filter.dateFrom).toBe('2026-06-01');
    expect(filter.dateTo).toBe('2026-10-31');
  });

  it('validates a harvest report for hivernage', () => {
    const filter = harvestReportSchema.parse({
      season: 'hivernage',
      dateFrom: '2026-06-01',
      dateTo: '2026-10-31',
    });
    expect(filter.season).toBe('hivernage');
  });
});
