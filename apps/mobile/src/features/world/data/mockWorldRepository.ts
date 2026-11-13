import type { RegionPreview } from '../domain/RegionPreview';

const previewRegions: readonly RegionPreview[] = [
  {
    id: 'region-verdant-reach',
    name: 'Verdant Reach',
    description: 'An illustrated demo region with no real-world coordinates.',
    discoveries: 4,
  },
];

export function readMockRegions(): readonly RegionPreview[] {
  return previewRegions;
}

