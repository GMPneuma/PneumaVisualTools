# Visual Tools backlog

Updated: 2026-09-29

Edit each **Status** directly. Priorities are initial suggestions, not an agreed work order.

**Priority:** High = address next; Medium = useful, can wait; Low = optional improvement.\
**Status:** Idea = needs discussion; Ready = defined and available to pick up; In progress = work started; Blocked = cannot proceed; Done = completion criteria met; Dropped = no longer planned.

Keep IDs permanent. Add new items by copying an entry. Move finished or dropped items to the bottom and record a date and outcome. Listing work does not authorize implementation. Live verification means checking the actual Foundry world; automated checks alone do not satisfy it.

Sources: [README](README.md), [implemented features](IMPLEMENTED_FEATURES.md), and [header migration notes](docs/combat-header-migration.md). Existing styling is implemented; the work below concerns verification or explicit design decisions.

## Open items

### BL-001 — Verify chat cards in a live world

**Priority:** High\
**Status:** Ready

**Problem:** Browser fixtures do not establish that real native and Combat Tools cards work across clients.

**Desired result:** Record a live GM/player check of both skins and their controls.

**Done when:**

- [ ] Check native, attack, damage, grapple, QuickHack and area-effect cards in both skins.
- [ ] Verify blind/whisper visibility, hidden identities, portraits and fallback images as GM and player.
- [ ] Check narrow chat widths, long names, expanded rolls, native damage/undo and late-added controls.
- [ ] Verify skin switching, saved settings and the compact-chat master switch.

**Notes:** README.md and IMPLEMENTED_FEATURES.md explicitly leave live verification pending.

### BL-002 — Verify Neural Intrusion screen effects

**Priority:** Medium\
**Status:** Ready

**Problem:** The documented screen effects depend on Combat Tools and client display preferences.

**Desired result:** Confirm effects start and stop under the intended conditions.

**Done when:**

- [ ] Check detected Jack-In and ejection with Combat Tools active.
- [ ] Check disabling effects, reduced motion, hidden tabs and absence of Combat Tools.
- [ ] Record tested versions and results.

**Notes:** Source: IMPLEMENTED_FEATURES.md; mechanics remain in Combat Tools.

### BL-003 — Decide ownership of combat header rendering

**Priority:** Low\
**Status:** Idea

**Problem:** The migration notes describe a possible move into Combat Tools, while Visual Tools currently owns the adapters.

**Desired result:** Decide whether to retain or move the adapters and update the ownership documentation.

**Done when:**

- [ ] Record the ownership decision.
- [ ] If a move is approved, preserve visibility, saved titles, native controls and skin contracts without duplicate renderers.
- [ ] Correct the older client-scoped portrait statement to match the documented GM world setting.

**Notes:** Source: docs/combat-header-migration.md. This entry does not approve migration.

### BL-004 — Prepare the first published release

**Priority:** Medium\
**Status:** Blocked

**Problem:** The README states that no release has been published and live verification is pending.

**Desired result:** Provide a verified installable package when release is authorized.

**Done when:**

- [ ] Complete BL-001 and BL-002 or record explicitly accepted limitations.
- [ ] Check matching manifest/package versions and a ZIP with runtime files at its root.
- [ ] When authorized, publish and verify installation from the public manifest.

**Notes:** Blocked on live verification and release authorization; no release performed by this documentation task.

## Done or dropped

Existing features and superseded visual designs remain recorded in [IMPLEMENTED_FEATURES.md](IMPLEMENTED_FEATURES.md).
