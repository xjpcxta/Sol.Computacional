import { describe, expect, it } from 'vitest';
import {
  prepareSplitFlapFrame,
  prepareSplitFlapMessage,
  SPLIT_FLAP_COLUMNS,
  SPLIT_FLAP_FRAMES,
  SPLIT_FLAP_ROWS,
} from './splitFlapMessages';

describe('prepareSplitFlapMessage', () => {
  it('normalizes accents, uppercases, and returns one cell per column', () => {
    const cells = prepareSplitFlapMessage(
      'Orçamento rastreável',
      SPLIT_FLAP_COLUMNS,
    );

    expect(cells).toHaveLength(SPLIT_FLAP_COLUMNS);
    expect(cells.join('').trim()).toBe('ORCAMENTO RASTREAVEL');
  });

  it('centers shorter messages and truncates overflow deterministically', () => {
    expect(prepareSplitFlapMessage('PF', 6).join('')).toBe('  PF  ');
    expect(prepareSplitFlapMessage('1234567', 4).join('')).toBe('1234');
  });
});

describe('prepareSplitFlapFrame', () => {
  it('creates a complete multi-line board and fills unused rows with blank plates', () => {
    const rows = prepareSplitFlapFrame(['Calculadora', 'de dev']);

    expect(rows).toHaveLength(SPLIT_FLAP_ROWS);
    expect(rows.every((row) => row.length === SPLIT_FLAP_COLUMNS)).toBe(true);
    expect(rows[0]?.join('').trim()).toBe('CALCULADORA');
    expect(rows[1]?.join('').trim()).toBe('DE DEV');
    expect(rows.slice(2).every((row) => row.every((cell) => cell === ' '))).toBe(true);
  });

  it('keeps every content frame on the same ten-row board', () => {
    expect(SPLIT_FLAP_ROWS).toBe(10);
    expect(SPLIT_FLAP_COLUMNS).toBe(20);
    expect(SPLIT_FLAP_FRAMES.every((frame) => frame.lines.length === SPLIT_FLAP_ROWS)).toBe(true);
    expect(SPLIT_FLAP_FRAMES.every((frame) => frame.lines.some((line) => line === ''))).toBe(true);
  });
});
