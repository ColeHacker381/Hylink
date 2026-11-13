export type QuestStatus = 'ready' | 'planned';

export interface QuestPreview {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly status: QuestStatus;
}

