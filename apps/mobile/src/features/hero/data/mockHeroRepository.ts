import type { HeroPreview } from '../domain/HeroPreview';

export function readMockHero(): HeroPreview {
  return {
    title: 'Wayfinder',
    level: 3,
    levelProgressPercent: 38,
    activeSkills: ['Focus', 'Kindness', 'Curiosity'],
  };
}

