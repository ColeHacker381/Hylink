import { readMockQuestPreviews } from '../data/mockQuestRepository';
import type { QuestPreview } from '../domain/QuestPreview';

export function listQuestPreviews(): readonly QuestPreview[] {
  return readMockQuestPreviews();
}

