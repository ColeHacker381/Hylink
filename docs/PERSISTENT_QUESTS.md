# Persistent quest management

## Architecture

Quest behavior lives in `packages/domain/src/quests`. It defines the entity, recurrence rules, filters, typed events, repository contract, validation, and lifecycle service. Presentation code never imports SQLite.

`packages/database` owns the Drizzle SQLite schema, versioned migrations, Expo connection adapter, and repository implementation. `apps/mobile` opens the database once in `QuestProvider` and exposes application operations plus a revision signal that refreshes Home, Journal, and detail views after mutations.

The runtime database is `hylink.db`. `expo-sqlite` supplies durable device storage and `drizzle-orm` supplies the typed schema and Expo database binding. The repository uses a narrow async SQLite connection contract so the same migrations and queries can run against temporary Node SQLite databases in tests.

## Schema and relationships

Migration `0001_quest_foundation` creates:

- `schema_migrations`: applied migration IDs and timestamps.
- `quests`: UUID identity, title/description, type, difficulty, lifecycle status, ISO timestamps, due timezone, schedule, priority, notes, future questline/parent fields, reward-preview JSON, recurrence wall-time rule, and soft-deletion timestamp.
- `quest_occurrences`: bounded recurring instances with a unique occurrence key and independent completion state.
- `domain_events`: transactional outbox records with UUID event IDs, schema version, aggregate/occurrence identity, JSON payload, timestamps, and a unique deduplication key.
- `quest_skill_links`, `quest_location_links`, and `quest_achievement_links`: forward-compatible identifiers without fake records or foreign keys into unfinished domains.

Quest deletion is soft: `deleted_at` hides the quest from normal reads while retaining lifecycle history and events. Archive is a visible lifecycle state and is distinct from deletion.

All entity/event identifiers are UUIDs. Stored timestamps are ISO 8601 UTC instants. Due timestamps include the originating IANA timezone, and recurrence rules retain the wall-time timezone.

## Migrations

`openHylinkDatabase()` enables foreign keys and invokes `migrateDatabase()` before constructing the repository. Each unapplied migration runs transactionally and is recorded only after its SQL succeeds. Add future migrations to the ordered migration list; never edit an already-published migration.

Database tests apply migrations twice to verify idempotency and reopen the same temporary file to verify persistence.

## Repository and service contracts

The repository provides:

- `createQuest`, `getQuest`, `listQuests`, and `updateQuest`
- `completeQuest` and `reopenQuest`
- `archiveQuest` and soft `deleteQuest`
- occurrence save/read operations
- domain-event reads for tests and future consumers

`QuestService` validates required titles, ISO timestamps, timezones, recurrence rules, and lifecycle transitions. Create, update, completion, reopen, and archive mutations write their domain event in the same SQLite transaction as state changes. Completing an already-completed quest or occurrence is a no-op and cannot append another completion event.

## Recurrence

Supported rules are daily, weekly from the seed weekday, and selected weekdays, with an optional end date. The rule stores an IANA timezone and preserves the original local wall time across daylight-saving transitions.

Occurrences are generated on demand for a rolling window from seven days before now through 60 days ahead, with an additional hard maximum of 64 generated rows per request. `occurrence_key` combines quest identity and local calendar date and is unique. Completing one row never changes future rows or marks the recurring parent completed.

Future XP processing should consume `quest.completed` events using the occurrence identity as part of an idempotent ledger source key. This milestone only renders reward previews; it does not award XP or rupees.

## Screens

- Quick Add creates a title-only quest immediately or reveals advanced type, difficulty, due date, scheduled time, priority, recurrence, weekday, end-date, description, and notes controls.
- Journal includes Today, Upcoming, All Quests, Completed, and Archived views with filters and sorting.
- Quest Detail supports editing, completing/reopening, archiving, soft deletion, reward previews, and recurring occurrence controls.
- Home shows real today, overdue, upcoming, and completed quest information while retaining clearly labeled example progression.

## Verification

Run from the repository root:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Tests cover migration initialization, CRUD, file reopening, lifecycle transitions, completion idempotency, archive/deletion policy, dashboard time filters, DST-aware recurrence, occurrence independence, invalid input, database errors, quick creation, and completion controls.

## Known limitations

- Native device and simulator behavior must still be checked manually, including VoiceOver and large dynamic type.
- Recurrence editing does not delete historical occurrence rows; future rows outside the current rule simply stop appearing in generated windows.
- There is no cloud synchronization or multi-device conflict handling.
- Questline, skill, location, achievement, and reward fields are prepared but their owning modules are not implemented here.
- XP and rupee values are previews only and are not posted to ledgers.
