# Design System Master — The Hybrid Engine

> **Source of truth for athlete + coach UI.** Persisted 31 Aug 2026.
> Tool-default orange/green palettes are **rejected** — they fight Track Dawn.
> Product surfaces: Hybrid HTML athlete app (`apps/mobile/prototype/hybrid-app/index.html`)
> and Coach (`coach.html`). Do not recreate Expo / PWA / landing heroes here.

## Brand (do not change)

- **Identity:** copper / gold on deep charcoal — not purple, not acid green, not cream-serif
- **Mark:** `THE` in Barlow Condensed
- **Type:** Space Grotesk (body) + Barlow Condensed (display / eyebrows)
- **Athlete shell:** sticky brand header + 4-tab bottom nav, `max-width: 760px`
- **Coach shell:** left nav + header + main (desktop workspace)
- **Dial accents:** copper = strength; zone teal `#5ec4b4` = Engine / conditioning only

## Tokens (Track Dawn)

| Role | Token | Value |
|------|-------|-------|
| Background | `--bg` / `--bg-deep` | `#0a0c0e` / `#07090b` |
| Panel ladder | `--panel` / `--panel2` / `--panel3` | `#12161a` / `#181d22` / `#0e1216` |
| Borders | `--line` / `--line2` | `rgba(255,255,255,.08)` / `.12` |
| Text | `--text` / `--muted` / `--dim` | `#eef2f4` / `#9aa3ab` / `#6f7881` |
| Brand | `--copper` / `--copper2` / `--copper-dim` | `#d4a574` / `#e8c49a` / `rgba(212,165,116,.14)` |
| Engine | `--zone` / `--zone-dim` | `#5ec4b4` / `rgba(94,196,180,.14)` |
| Status | `--ok` / `--warn` / `--bad` | `#7dba9a` / `#d4a35b` / `#d0897d` |
| Radius | `--r` / `--r-lg` | `16px` / `22px` (coach may use `--r:16`) |
| Tap | `--tap-min` / `--tap` | **44px minimum** on interactive controls |
| Space | `--space-1`…`--space-4` | `4 / 8 / 12 / 16px` |
| Motion | `--ease` | `cubic-bezier(.22,.7,.28,1)` |
| Focus | `--focus` | copper ring on dark |

## Interaction rules

1. **Touch targets ≥ 44px** — including `.btn.small`, calendar actions, Library template actions.
2. **8px+ gap** between adjacent tappable controls.
3. **One primary CTA per card/section** — Schedule (Library) / Start (Calendar) / Save (builder).
4. **Destructive actions** are secondary weight (outline/ghost danger), never equal to primary.
5. **`touch-action: manipulation`** on buttons; honor `prefers-reduced-motion`.
6. **Visible `:focus-visible`** via `--focus` — no outline:none without replacement.
7. **Copy:** sentence case, active verbs (“Save template”, “Duplicate”, “Schedule”). No system jargon.

## Anti-patterns (banned)

- Generic orange `#F97316` / vibrant block startup look from generic fitness templates
- Purple-on-white, cream+#terracotta editorial, broadsheet hairlines
- Emoji as structural icons
- Cards in heroes; dashboard clutter on first viewport of marketing surfaces
- Shrinking `.btn.small` below 44px for “density”
- Mutating seed templates in place — copy-on-write to `THE-user`

## Surfaces

| Surface | Page override |
|---------|----------------|
| Library templates | `pages/library.md` |
| Coach workspace | `pages/coach.md` |

When building a screen: read this MASTER, then the page file if present (page wins).
