# Milestone 2.1 verification review

Date: 2026-11-13

## Recurring-completion diagnosis and fix

The failing native path was concurrent recurrence materialization. Home requests four quest views in parallel, and mounted Journal/detail views may query at the same time. Each recurring query called `saveOccurrences()`, so several `withTransactionAsync()` calls could overlap on one Expo SQLite connection. That API is explicitly non-exclusive, and repository statements used the base database rather than a callback-scoped transaction handle. On native SQLite this can produce transaction-state or lock errors when the user completes an occurrence during refresh.

The adapter now serializes application transactions. iOS and Android use `withExclusiveTransactionAsync()` and wrap its callback-scoped connection; web retains its supported transaction API. Repository operations receive that scoped connection explicitly. Completion uses a conditional status update inside the same transaction as event insertion, so concurrent attempts create one transition/event and an event failure rolls the status change back.

The regression test recreates the problematic shape by completing a persisted recurring occurrence while dashboard and Journal-style recurrence queries run concurrently. It verifies the selected occurrence and exactly one completion event. Sibling independence, reopen, restart persistence, rollback, and eight-way simultaneous completion are also covered.

## Recurrence generation and editing

Generation now derives its first and last local calendar offsets from the requested window. Daily, weekly, and selected-weekday rules remain aligned to the original seed, including interval weeks, while wall-clock conversion continues through the IANA timezone. Work is bounded by the window and the 64-occurrence cap rather than quest age.

Rule edits use a minimal history-safe policy: completed rows/events are never changed; active rows are displayed only when their stable occurrence key still belongs to the current rule; newly valid rows are conflict-safe inserts. This keeps unaffected IDs stable and hides obsolete future instances without destructive history rewrites.

## Date/time and operation feedback

Advanced Quick Add and Edit use the Expo-compatible native community date/time picker for due dates, scheduled dates/times, and recurrence end dates. Due dates and scheduled times remain distinct. Local picker values are persisted as UTC ISO instants with the local IANA timezone. Domain validation rejects impossible calendar dates instead of accepting JavaScript rollover.

Create/update await persistence before navigation. Journal and detail lifecycle controls now catch failures, show user-safe retry feedback, and disable mutation controls while a write is pending. Delete navigates only after success, and context revisions advance only after persistence succeeds.

## Automated verification

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm benchmark:quests
```

The automated suites cover CRUD/migrations/restart persistence, recurring completion/reopen, duplicate completion, rollback, concurrency, long-running recurrence, DST, recurrence edits, invalid dates, large filtering/sorting, save retry, and pending UI controls.

## Benchmark methodology and results

The repeatable benchmark uses a fresh temporary Node SQLite file and removes it afterward. It creates 1,000 ordinary quests plus 100 recurring quests, exercises 100-row mutation batches, generates/reloads a 60-day recurrence window, checks a multi-year seed, races 20 completion attempts, and closes/reopens the file. Results from the managed Linux environment on 2026-11-13:

| Operation | Elapsed |
| --- | ---: |
| Create 100 quests | 137.5 ms |
| Load 1,000 quests | 27.3 ms |
| Update 100 quests | 138.1 ms |
| Complete 100 quests | 238.8 ms |
| Reopen 100 quests | 167.2 ms |
| Filter/sort 1,000 quests | 48.3 ms |
| Generate 100 recurring 60-day windows | 369.4 ms |
| Reload the existing windows without duplicates | 279.2 ms |
| Generate one multi-year 60-day window | 1.0 ms |
| Race 20 completion attempts | 2.7 ms |
| Read after database reopen | 0.2 ms |

The resulting benchmark database was 3,399,680 bytes and process heap usage at report time was 17,043,432 bytes. These are development-machine Node.js measurements, not iPhone performance claims. No meaningful regression baseline exists yet; these values establish the first repeatable baseline.

## Physical-device status

The project owner reported that the Milestone 2 build passed ordinary quest flows on a physical iPhone and exposed the recurring-completion failure. This environment has no attached iPhone, so the Milestone 2.1 fix has **not** been claimed as physically verified.

Manual iPhone checklist:

1. Upgrade an existing installation without deleting `hylink.db` and confirm prior quests remain.
2. Create daily, biweekly, and selected-weekday quests with native date/time pickers.
3. Complete one visible occurrence from Journal and confirm only that date changes.
4. Tap Complete repeatedly and confirm one transition with no error.
5. Restart the app and confirm the occurrence remains completed.
6. Reopen that occurrence and confirm neighboring dates remain unchanged.
7. Change a daily rule to weekly; confirm completed history remains and obsolete future daily rows disappear.
8. Trigger create, edit, complete, reopen, archive, and delete; confirm controls disable while saving and failures remain retryable.
9. Check DST-boundary scheduling in the device timezone.
10. Repeat with VoiceOver, large text, and reduced motion enabled.

## Remaining limitations

- Physical-iPhone verification of this patch remains outstanding.
- Web cannot use Expo SQLite's native exclusive transaction API, so it uses the serialized supported transaction path.
- Recurrence exceptions and per-instance rescheduling are intentionally deferred.
- Rewards remain previews; maps, GPS, banking, AI, and cloud synchronization remain out of scope.
