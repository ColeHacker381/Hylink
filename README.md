# Hylink

Hylink is a personal, offline-first adventure journal built with Expo, React Native, TypeScript, and Expo Router. The foundation uses original parchment-inspired styling and mock data only.

## Start the foundation

```bash
pnpm install --frozen-lockfile
pnpm start
```

Use `pnpm web` for a browser preview. The mobile app contains Home, Journal, World, Treasury, and Hero tabs plus a global quick-add modal.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Pure domain helpers run under Vitest. Reusable React Native components run under Jest Expo with React Native Testing Library.

## Native platform notes

- macOS: install a current Xcode release and its command-line tools, accept the Xcode license, install an iOS Simulator, then run `pnpm ios`. CocoaPods is only needed after native dependencies require a generated native project.
- Fedora/Linux: Apple does not provide Xcode or the iOS Simulator, so a local native iPhone build is unavailable. For this foundation, run `pnpm start` and open it on a physical iPhone with Expo Go, or use `pnpm web`. A later custom development build can be produced with a configured remote iOS build service.

No GPS, maps, API keys, private addresses, bank connections, or persistent quest writes are included in this milestone.
