# Visual Tools backlog

Updated: 2026-10-11

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

**Desired result:** Record a live GM/player check of all four skins and their controls.

**Done when:**

- [ ] Check native, attack, damage, grapple, QuickHack and area-effect cards in all four skins.
- [ ] Verify blind/whisper visibility, hidden identities, portraits and fallback images as GM and player.
- [ ] Check narrow chat widths, long names, expanded rolls, native damage/undo and late-added controls.
- [ ] Verify skin switching, saved settings and the Enable Chat Card Re-Skin master switch.

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

### BL-005 - Verify remaining effects and combat animations in a live world

**Priority:** High\
**Status:** Ready

**Done when:**

- [ ] Verify screen/token effect activation, expiry, disablement and removal, including native Blue Glass use and Choking 1/2 transitions.
- [ ] Verify attack audio/visuals and persistent AoE effects as GM and player, including resolution, template deletion, encounter end and scene changes.
- [ ] Verify custom themes, saved settings and Cancel restoration in real sheets and dialogs.
- [ ] Record module/system versions and results; include reduced motion and independent screen/token switches.

### BL-006 - Electrical Shock gameplay activation

**Priority:** Low\
**Status:** Idea

The renderer and preview exist. Gameplay activation is deliberately deferred until a trigger and clearing contract are defined. This entry does not authorize new mechanics.

### BL-007 - Run behavioral tests in CI

**Priority:** Medium\
**Status:** Ready

CI currently validates TypeScript/module files and builds the package. Add a repeatable test entry point and the required browser dependencies to run the existing behavioral/browser suites. Local test history is recorded in IMPLEMENTED_FEATURES.md.

### BL-008 - Enhance Cyberpsychosis effects

**Priority:** Medium\
**Status:** Idea

Enhance the existing Cyberpsychosis visual effects. Specific visual changes remain to be defined.

## Done or dropped

### BL-003 - Decide ownership of combat header rendering

**Status:** Done (2026-10-11 documentation reconciliation)

The existing [presentation boundary](docs/combat-header-migration.md) records Visual Tools ownership of presentation and Combat Tools ownership of rules, state and controls. Portrait settings are already documented as GM/world settings. No migration is scheduled or performed by this cleanup.

### BL-004 - Prepare the first published release

**Status:** Dropped (2026-10-11; superseded)

The original first-release blocker is obsolete: the checkout records v0.5.0 in its release commit, changelog and manifests. This cleanup does not reverify public release assets or installation. Outstanding live verification remains in BL-001, BL-002 and BL-005.

Existing features and superseded visual designs remain recorded in [IMPLEMENTED_FEATURES.md](IMPLEMENTED_FEATURES.md).
