import type { TreasuryPreview } from '../domain/TreasuryPreview';

export function readMockTreasuryPreview(): TreasuryPreview {
  return { connectedAccountCount: 0, rupees: 120 };
}

