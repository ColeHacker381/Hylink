export const questTypes = ['main', 'side', 'daily', 'recurring', 'miscellaneous'] as const;
export type QuestType = (typeof questTypes)[number];

export const questDifficulties = ['easy', 'normal', 'hard', 'epic'] as const;
export type QuestDifficulty = (typeof questDifficulties)[number];

export const questStatuses = ['active', 'completed', 'canceled', 'archived'] as const;
export type QuestStatus = (typeof questStatuses)[number];

export const questPriorities = ['low', 'normal', 'high', 'urgent'] as const;
export type QuestPriority = (typeof questPriorities)[number];

export const recurrenceFrequencies = ['daily', 'weekly', 'weekdays'] as const;
export type RecurrenceFrequency = (typeof recurrenceFrequencies)[number];

export interface RecurrenceRule {
  readonly frequency: RecurrenceFrequency;
  readonly interval: number;
  readonly weekdays: readonly number[];
  readonly endsAt: string | null;
  readonly timezone: string;
}

export interface RewardPreview {
  readonly amount: number;
  readonly source: 'preview';
}

export interface Quest {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly type: QuestType;
  readonly difficulty: QuestDifficulty;
  readonly status: QuestStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly dueAt: string | null;
  readonly dueTimezone: string | null;
  readonly scheduledAt: string | null;
  readonly completedAt: string | null;
  readonly priority: QuestPriority | null;
  readonly notes: string | null;
  readonly parentQuestId: string | null;
  readonly questlineId: string | null;
  readonly skillIds: readonly string[];
  readonly achievementIds: readonly string[];
  readonly xpReward: RewardPreview | null;
  readonly rupeeReward: RewardPreview | null;
  readonly recurrence: RecurrenceRule | null;
  readonly deletedAt: string | null;
}

export type QuestOccurrenceStatus = 'active' | 'completed';

export interface QuestOccurrence {
  readonly id: string;
  readonly questId: string;
  readonly occurrenceKey: string;
  readonly scheduledFor: string;
  readonly status: QuestOccurrenceStatus;
  readonly completedAt: string | null;
  readonly createdAt: string;
}

export interface CreateQuestInput {
  readonly title: string;
  readonly description?: string | null;
  readonly type?: QuestType;
  readonly difficulty?: QuestDifficulty;
  readonly dueAt?: string | null;
  readonly dueTimezone?: string | null;
  readonly scheduledAt?: string | null;
  readonly priority?: QuestPriority | null;
  readonly notes?: string | null;
  readonly parentQuestId?: string | null;
  readonly questlineId?: string | null;
  readonly skillIds?: readonly string[];
  readonly achievementIds?: readonly string[];
  readonly xpReward?: RewardPreview | null;
  readonly rupeeReward?: RewardPreview | null;
  readonly recurrence?: RecurrenceRule | null;
}

export interface UpdateQuestInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly type?: QuestType;
  readonly difficulty?: QuestDifficulty;
  readonly dueAt?: string | null;
  readonly dueTimezone?: string | null;
  readonly scheduledAt?: string | null;
  readonly priority?: QuestPriority | null;
  readonly notes?: string | null;
  readonly parentQuestId?: string | null;
  readonly questlineId?: string | null;
  readonly skillIds?: readonly string[];
  readonly achievementIds?: readonly string[];
  readonly xpReward?: RewardPreview | null;
  readonly rupeeReward?: RewardPreview | null;
  readonly recurrence?: RecurrenceRule | null;
}

export type QuestView = 'today' | 'upcoming' | 'all' | 'completed' | 'archived' | 'overdue';
export type QuestSort = 'dueAt' | 'createdAt' | 'priority';
export type SortDirection = 'asc' | 'desc';

export interface QuestFilters {
  readonly view?: QuestView;
  readonly type?: QuestType;
  readonly difficulty?: QuestDifficulty;
  readonly status?: QuestStatus;
  readonly priority?: QuestPriority;
  readonly sort?: QuestSort;
  readonly direction?: SortDirection;
  readonly now?: string;
  readonly timezone?: string;
}

export interface QuestListItem {
  readonly quest: Quest;
  readonly occurrence: QuestOccurrence | null;
}

export interface QuestDashboard {
  readonly today: readonly QuestListItem[];
  readonly overdue: readonly QuestListItem[];
  readonly upcoming: readonly QuestListItem[];
  readonly completedCount: number;
}

