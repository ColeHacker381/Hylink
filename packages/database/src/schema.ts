import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import type { QuestDifficulty, QuestPriority, QuestStatus, QuestType } from '@hylink/domain';

export const schemaMigrations = sqliteTable('schema_migrations', {
  id: text('id').primaryKey(),
  appliedAt: text('applied_at').notNull(),
});

export const quests = sqliteTable('quests', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').$type<QuestType>().notNull(),
  difficulty: text('difficulty').$type<QuestDifficulty>().notNull(),
  status: text('status').$type<QuestStatus>().notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dueAt: text('due_at'),
  dueTimezone: text('due_timezone'),
  scheduledAt: text('scheduled_at'),
  completedAt: text('completed_at'),
  priority: text('priority').$type<QuestPriority>(),
  notes: text('notes'),
  parentQuestId: text('parent_quest_id'),
  questlineId: text('questline_id'),
  xpRewardJson: text('xp_reward_json'),
  rupeeRewardJson: text('rupee_reward_json'),
  recurrenceJson: text('recurrence_json'),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('quests_due_at_idx').on(table.dueAt),
  index('quests_scheduled_at_idx').on(table.scheduledAt),
  index('quests_status_idx').on(table.status),
  index('quests_parent_quest_id_idx').on(table.parentQuestId),
]);

export const questOccurrences = sqliteTable('quest_occurrences', {
  id: text('id').primaryKey(),
  questId: text('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  occurrenceKey: text('occurrence_key').notNull(),
  scheduledFor: text('scheduled_for').notNull(),
  status: text('status').$type<'active' | 'completed'>().notNull(),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('quest_occurrences_key_unique').on(table.occurrenceKey),
  index('quest_occurrences_quest_schedule_idx').on(table.questId, table.scheduledFor),
]);

export const domainEvents = sqliteTable('domain_events', {
  eventId: text('event_id').primaryKey(),
  type: text('type').notNull(),
  schemaVersion: integer('schema_version').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  occurrenceId: text('occurrence_id'),
  payloadJson: text('payload_json').notNull(),
  occurredAt: text('occurred_at').notNull(),
  createdAt: text('created_at').notNull(),
  dedupeKey: text('dedupe_key').notNull(),
}, (table) => [
  uniqueIndex('domain_events_dedupe_unique').on(table.dedupeKey),
  index('domain_events_aggregate_idx').on(table.aggregateId, table.occurredAt),
]);

export const questSkillLinks = sqliteTable('quest_skill_links', {
  questId: text('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  skillId: text('skill_id').notNull(),
}, (table) => [primaryKey({ columns: [table.questId, table.skillId] })]);

export const questLocationLinks = sqliteTable('quest_location_links', {
  questId: text('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  placeId: text('place_id').notNull(),
}, (table) => [primaryKey({ columns: [table.questId, table.placeId] })]);

export const questAchievementLinks = sqliteTable('quest_achievement_links', {
  questId: text('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').notNull(),
}, (table) => [primaryKey({ columns: [table.questId, table.achievementId] })]);

export const databaseSchema = {
  schemaMigrations,
  quests,
  questOccurrences,
  domainEvents,
  questSkillLinks,
  questLocationLinks,
  questAchievementLinks,
};

