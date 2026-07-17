# Testing Strategy

## Current Baseline

The repository uses Vitest, jsdom, and Testing Library. Before this testing pass, the suite contained 35 test files and 439 passing tests. It ran locally in about seven seconds.

Coverage should be interpreted by risk area rather than as one target number. The initial report included maintenance scripts and the service worker, which made the 40.44% overall figure misleading. Coverage is now scoped to TypeScript application source under `src/`.

The current source-only baseline is 41.55% statements, 58.18% branches, 37.4% functions, and 41.55% lines. Utilities are at 65.3% statements and hooks are at 52.88%. Multisample components are the clearest large UI gap at 13.88%.

The strongest existing coverage is in pure audio and storage utilities. The largest meaningful gaps are complex UI interactions, session restoration, Web MIDI lifecycle behavior, and advanced multisample controls.

## Pull Request Gate

`.github/workflows/unit-tests.yml` installs the locked dependency graph with `npm ci` and runs `npm test` on pull requests targeting `main`. It also runs after changes land on `main`.

To make the check a merge gate, configure the repository's `main` branch ruleset to require the `Unit tests / test` status check. The workflow alone reports failures but cannot prevent a merge without that repository setting.

End-to-end tests are intentionally excluded from this gate for now.

## Improvement Plan

1. **Make current tests trustworthy.** Remove placeholder assertions, skipped assertions, unexpected console errors, and React `act(...)` warnings. A passing test should not hide a failed mock or an unexecuted assertion.
2. **Protect preset output.** Add fixture-based tests for drum and multisample `patch.json` output, filename generation, sample ranges, imported settings, and WAV/AIFF metadata preservation. These formats are the product's compatibility boundary.
3. **Cover browser-state boundaries.** Add focused tests for session restoration, IndexedDB migrations and failures, drag-and-drop ordering, and Web MIDI connect/disconnect and listener cleanup.
4. **Test complex UI behavior selectively.** Prioritize waveform boundary editing, advanced multisample controls, recording cleanup, and keyboard accessibility. Avoid snapshot-heavy tests and assert user-visible behavior instead.
5. **Introduce a coverage ratchet later.** Once noisy and placeholder tests are repaired, record the stable source-only baseline and prevent it from decreasing. Prefer thresholds for critical utility and hook folders over a single global percentage.
6. **Expand automation incrementally.** Keep unit tests as the fast required check. Add lint and production build as separate required checks after their existing failures and warnings are assessed. Add a small end-to-end smoke suite only when critical browser workflows justify its maintenance cost.

## Local Commands

```bash
npm test
npm run test:watch
npm run test:coverage
```
