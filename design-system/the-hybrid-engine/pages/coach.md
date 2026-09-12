# Coach — page overrides

Desktop-first workspace. Keep left nav + header shell.

## Align with athlete Track Dawn

- Radius `--r: 16px` (not 12) for cards/buttons
- Tap `--tap: 44px` on `.btn`, `.btn.small`, side nav items, header actions that are interactive
- Copper primary fill `#14110d` text on `--copper` (same contrast contract as athlete)
- Ghost = transparent + copper text; danger = `--bad` text, not equal primary weight

## Differences allowed

- Flat primary (no athlete gradient) is OK for dense desktop tables
- Coach-only chrome vars (`--coach-nav-*`, rail) stay coach-local
- No bottom tab bar; no zone teal unless viewing conditioning content

## Do not

- Port athlete bottom nav
- Introduce orange/green marketing palette
- Leave drag handles / kebabs under 44×44 without expanded hit area on touch breakpoints
