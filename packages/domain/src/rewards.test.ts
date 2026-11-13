import { describe, expect, it } from 'vitest';

import { formatRupees } from './rewards';

describe('formatRupees', () => {
  it('formats virtual currency without implying real money', () => {
    expect(formatRupees(1200)).toBe('1,200 rupees');
  });

  it('guards against negative and invalid values', () => {
    expect(formatRupees(-20)).toBe('0 rupees');
    expect(formatRupees(Number.NaN)).toBe('0 rupees');
  });
});

