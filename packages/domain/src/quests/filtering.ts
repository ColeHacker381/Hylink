import type { QuestFilters, QuestListItem, QuestPriority } from './types';
import { zonedDateKey } from './time';

const priorityWeight: Record<QuestPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
};

function itemDate(item: QuestListItem): string | null {
  return item.occurrence?.scheduledFor ?? item.quest.dueAt ?? item.quest.scheduledAt;
}

function itemCompleted(item: QuestListItem): boolean {
  return item.occurrence ? item.occurrence.status === 'completed' : item.quest.status === 'completed';
}

export function filterQuestItems(
  items: readonly QuestListItem[],
  filters: QuestFilters,
): readonly QuestListItem[] {
  const now = filters.now ?? new Date().toISOString();
  const timezone = filters.timezone ?? 'UTC';
  const todayKey = zonedDateKey(now, timezone);

  const filtered = items.filter((item) => {
    const { quest } = item;
    if (filters.type && quest.type !== filters.type) return false;
    if (filters.difficulty && quest.difficulty !== filters.difficulty) return false;
    if (filters.priority && quest.priority !== filters.priority) return false;
    const effectiveStatus = item.occurrence?.status ?? quest.status;
    if (filters.status && effectiveStatus !== filters.status) return false;

    const date = itemDate(item);
    const completed = itemCompleted(item);
    switch (filters.view ?? 'all') {
      case 'today':
        return !completed && quest.status === 'active' && date !== null && zonedDateKey(date, timezone) === todayKey;
      case 'upcoming':
        return !completed && quest.status === 'active' && date !== null && date > now && zonedDateKey(date, timezone) !== todayKey;
      case 'overdue':
        return !completed && quest.status === 'active' && date !== null && date < now && zonedDateKey(date, timezone) !== todayKey;
      case 'completed':
        return completed;
      case 'archived':
        return quest.status === 'archived';
      case 'all':
        return quest.status !== 'archived';
    }
  });

  const direction = filters.direction === 'desc' ? -1 : 1;
  const sort = filters.sort ?? 'dueAt';
  return [...filtered].sort((left, right) => {
    if (sort === 'priority') {
      const leftValue = left.quest.priority ? priorityWeight[left.quest.priority] : 0;
      const rightValue = right.quest.priority ? priorityWeight[right.quest.priority] : 0;
      return (leftValue - rightValue) * direction;
    }
    const leftValue = sort === 'createdAt' ? left.quest.createdAt : (itemDate(left) ?? '9999');
    const rightValue = sort === 'createdAt' ? right.quest.createdAt : (itemDate(right) ?? '9999');
    return leftValue.localeCompare(rightValue) * direction;
  });
}

