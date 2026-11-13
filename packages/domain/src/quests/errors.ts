export class QuestValidationError extends Error {
  readonly code = 'QUEST_VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'QuestValidationError';
  }
}

export class QuestNotFoundError extends Error {
  readonly code = 'QUEST_NOT_FOUND';

  constructor(id: string) {
    super(`Quest ${id} was not found.`);
    this.name = 'QuestNotFoundError';
  }
}

export class QuestStateError extends Error {
  readonly code = 'QUEST_STATE_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'QuestStateError';
  }
}

export class QuestPersistenceError extends Error {
  readonly code = 'QUEST_PERSISTENCE_ERROR';
  override readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'QuestPersistenceError';
    this.cause = cause;
  }
}

