import { describe, expect, it } from 'vitest';

import { calculateCompletionPercent, clampPercent } from './progress';

describe('progress helpers', () => {
  it('calculates a rounded completion percentage', () => {
    expect(calculateCompletionPercent(2, 3)).toBe(67);
  });

  it('returns zero when no total exists', () => {
    expect(calculateCompletionPercent(2, 0)).toBe(0);
  });

  it('clamps invalid and out-of-range values', () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(-12)).toBe(0);
    expect(clampPercent(141)).toBe(100);
  });
});

