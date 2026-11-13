import type { QuestListItem } from '@hylink/domain';

export function formatQuestDate(item: QuestListItem): string {
  const value = item.occurrence?.scheduledFor ?? item.quest.dueAt ?? item.quest.scheduledAt;
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function questItemStatus(item: QuestListItem) {
  return item.occurrence?.status ?? item.quest.status;
}

