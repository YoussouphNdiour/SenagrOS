import { describe, expect, it } from 'vitest';
import {
  DROP_ABSOLUTE,
  DROP_RELATIVE,
  MIN_PREVIOUS,
  buildDropMessage,
  detectDrop,
} from './ndvi-alert.service';

const pt = (date: string, value: number) => ({ date, value });

describe('detectDrop', () => {
  it('ne decide rien avec moins de deux mesures', () => {
    expect(detectDrop([]).dropped).toBe(false);
    expect(detectDrop([pt('2026-09-01', 0.8)]).dropped).toBe(false);
  });

  it('signale une chute franche', () => {
    const v = detectDrop([pt('2026-08-01', 0.7), pt('2026-08-15', 0.4)]);
    expect(v.dropped).toBe(true);
    expect(v.absolute).toBeCloseTo(0.3);
    expect(v.relative).toBeCloseTo(0.4286, 3);
  });

  it('compare les deux mesures les plus recentes, pas les extremes', () => {
    const v = detectDrop([
      pt('2026-07-01', 0.9),
      pt('2026-08-01', 0.72),
      pt('2026-08-15', 0.71),
    ]);
    expect(v.dropped).toBe(false);
    expect(v.previous?.date).toBe('2026-08-01');
    expect(v.latest?.date).toBe('2026-08-15');
  });

  it('trie les points avant de comparer', () => {
    const v = detectDrop([pt('2026-08-15', 0.4), pt('2026-08-01', 0.7)]);
    expect(v.latest?.date).toBe('2026-08-15');
    expect(v.dropped).toBe(true);
  });

  it('ignore une chute sur sol nu, faute de couvert a perdre', () => {
    // -50 % en relatif, mais la valeur de depart est sous MIN_PREVIOUS
    const v = detectDrop([pt('2026-08-01', 0.2), pt('2026-08-15', 0.1)]);
    expect(v.dropped).toBe(false);
    expect(v.relative).toBeCloseTo(0.5);
  });

  it('exige la chute absolue en plus de la chute relative', () => {
    // -20 % en relatif mais seulement -0,07 en absolu
    const v = detectDrop([pt('2026-08-01', 0.35), pt('2026-08-15', 0.28)]);
    expect(v.relative).toBeGreaterThanOrEqual(DROP_RELATIVE);
    expect(v.absolute).toBeLessThan(DROP_ABSOLUTE);
    expect(v.dropped).toBe(false);
  });

  it('exige la chute relative en plus de la chute absolue', () => {
    // -0,10 en absolu mais seulement -11 % en relatif
    const v = detectDrop([pt('2026-08-01', 0.9), pt('2026-08-15', 0.8)]);
    expect(v.absolute).toBeCloseTo(0.1);
    expect(v.relative).toBeLessThan(DROP_RELATIVE);
    expect(v.dropped).toBe(false);
  });

  it('ne signale pas une hausse', () => {
    const v = detectDrop([pt('2026-08-01', 0.3), pt('2026-08-15', 0.8)]);
    expect(v.dropped).toBe(false);
    expect(v.absolute).toBeLessThan(0);
  });

  it('accepte une chute exactement aux seuils', () => {
    const previous = MIN_PREVIOUS + 0.2; // 0.5
    const latest = previous * (1 - DROP_RELATIVE); // 0.4, soit -0.1 absolu
    const v = detectDrop([pt('2026-08-01', previous), pt('2026-08-15', latest)]);
    expect(v.dropped).toBe(true);
  });

  it('ne divise pas par zero sur une mesure precedente nulle', () => {
    const v = detectDrop([pt('2026-08-01', 0), pt('2026-08-15', 0)]);
    expect(v.relative).toBe(0);
    expect(v.dropped).toBe(false);
  });
});

describe('buildDropMessage', () => {
  const verdict = detectDrop([pt('2026-08-01', 0.7), pt('2026-08-15', 0.4)]);

  it('oriente vers le deficit hydrique quand il a peu plu', () => {
    const msg = buildDropMessage('Parcelle Nord', verdict, 3.2);
    expect(msg).toContain('43 %');
    expect(msg).toContain('Parcelle Nord');
    expect(msg).toContain('deficit hydrique');
  });

  it('oriente vers une autre cause quand la pluie a ete suffisante', () => {
    const msg = buildDropMessage('Parcelle Nord', verdict, 85);
    expect(msg).toContain('ravageur');
    expect(msg).not.toContain('deficit hydrique');
  });

  it('signale explicitement une pluviometrie indisponible', () => {
    const msg = buildDropMessage('Parcelle Nord', verdict, null);
    expect(msg).toContain('indisponible');
  });
});
