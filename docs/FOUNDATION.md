# Foundation decision and verification

> Historical note: this records the first foundation milestone. Persistent quest storage and screens were added afterward; see `docs/PERSISTENT_QUESTS.md` for the current data architecture.

Date: 2026-11-13

## Scope and boundaries

The foundation is a pnpm workspace with the Expo application in `apps/mobile`, navigation-independent helpers in `packages/domain`, and reusable parchment components in `packages/ui`.

Each app feature is split into `domain`, `data`, `application`, and `ui` folders. Route files only select feature screens. At the time of this milestone, repositories returned immutable mock data; later milestones replace only the relevant mock boundaries.

Expo SDK 58, React 19.3, React Native 0.88, and Expo Router 58 are pinned in the lockfile. ESLint 9 is intentionally used because the current Expo lint plugin set does not yet declare ESLint 10 compatibility.

## Verified

- `pnpm install --frozen-lockfile`
- `pnpm peers check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`: five Vitest domain tests and four React Native Testing Library component tests
- Expo's offline SDK dependency check
- Expo Router web export through Metro
- Local Metro startup and HTTP response
- Automated Chromium smoke test at 375 × 667: Home, Journal, World, Treasury, and Hero tabs; quick-add open, title entry, save confirmation, and close

## Not yet verified

- Physical iPhone, iOS Simulator, Android device, or Android emulator execution
- VoiceOver, hardware keyboard, reduced-motion, and large dynamic-type behavior on a physical device
- Native development builds; the foundation has no custom native dependency and is intended to run in Expo Go
- SQLite migrations or persistent quest writes, which were deferred from this historical milestone

See the root README for macOS and Fedora startup notes.
