import type { HomeSnapshot } from '../domain/HomeSnapshot';
import { mockHomeSnapshot } from '../data/mockHomeSnapshot';

export function getHomeSnapshot(): HomeSnapshot {
  return mockHomeSnapshot;
}

