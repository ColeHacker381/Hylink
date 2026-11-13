import type { QuestPreview } from '../domain/QuestPreview';

const mockQuests: readonly QuestPreview[] = [
  { id: 'quest-morning', title: 'Plan the week ahead', detail: 'A small planning ritual', status: 'ready' },
  { id: 'quest-reading', title: 'Read for twenty minutes', detail: 'Optional evening quest', status: 'planned' },
  { id: 'quest-walk', title: 'Take a mindful walk', detail: 'No location tracking', status: 'planned' },
];

export function readMockQuestPreviews(): readonly QuestPreview[] {
  return mockQuests;
}

