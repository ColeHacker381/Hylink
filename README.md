# Hylink

Hylink is a personal, offline-first adventure journal built with Expo, React Native, TypeScript, Expo Router, SQLite, and Drizzle ORM. It uses original parchment-inspired styling and keeps quest data on the device.

## Start the app

```bash
pnpm install --frozen-lockfile
pnpm start
```

Use `pnpm web` for a browser preview. The mobile app contains Home, Journal, World, Treasury, and Hero tabs plus a global quick-add modal.

## Quest management

- Use the global **+** action to create a quest with only a title, or reveal advanced scheduling, difficulty, priority, recurrence, and notes.
- Journal views cover Today, Upcoming, All Quests, Completed, and Archived with type, difficulty, priority, status, and sorting controls.
- Open a quest to edit, complete or reopen it, archive it, or soft-delete it with confirmation.
- Daily, weekly, and selected-weekday recurrence is generated in a bounded rolling window. Each occurrence is completed independently.
- Native date and time pickers provide local calendar scheduling without typed ISO timestamps.
- Home reads real today, overdue, upcoming, and completed data from SQLite. Character progression remains clearly labeled preview data.

The database is created automatically as `hylink.db` on first launch and versioned migrations run during startup. See [Persistent quests](docs/PERSISTENT_QUESTS.md) for schema and migration details.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm benchmark:quests
```

Domain and SQLite integration tests run under Vitest. Reusable React Native components run under Jest Expo with React Native Testing Library. Database tests use isolated temporary SQLite files and do not write a project database. The benchmark command likewise uses a temporary database and reports Node.js measurements only; it is not an iPhone performance claim.

## Native platform notes

- macOS: install a current Xcode release and its command-line tools, accept the Xcode license, install an iOS Simulator, then run `pnpm ios`. CocoaPods is only needed after native dependencies require a generated native project.
- Fedora/Linux: Apple does not provide Xcode or the iOS Simulator, so a local native iPhone build is unavailable. Run `pnpm start` and open it on a physical iPhone with Expo Go, or use `pnpm web`. A later custom development build can be produced with a configured remote iOS build service.

No GPS, maps, API keys, private addresses, bank connections, cloud synchronization, or durable XP/rupee awards are included in this milestone.
