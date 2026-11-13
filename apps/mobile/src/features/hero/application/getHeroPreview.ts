import { readMockHero } from '../data/mockHeroRepository';

export function getHeroPreview() {
  return readMockHero();
}

