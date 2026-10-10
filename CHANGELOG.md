# Changelog

## 0.5.0

- Add independent Token Effects and Full Screen Effects controls, shared artwork masking, reduced-motion support, and an effects preview menu.
- Enable On Fire and detected Neural Intrusion visuals; add Poison, Blue Glass, Smash, Radiation, Tear Gas, Flashbang and Humanity screen effects. Humanity remains private to the full-screen view.
- Add and refine Black Lace, Boost, Synthcoke, Berserker, Prime Time, Sixgun and Timewarp visuals. Black Lace uses cached screen artwork and a faint static token mesh; Boost uses yellow jets; Prime Time keeps fixed-size triangle geometry when resizing.
- Add Choking 1/2 visuals tied to native statuses, with stronger pulses at level 2.
- Redesign EMP with procedural white pixel grids that build and clear square by square, plus occasional typed diagnostic messages in changing positions. Token EMP includes a compact warning indicator.
- Improve attack sounds across all 15 animation profiles. Render recognizable bullets, pellets, rockets, arrows and grenades with ammo-colored outlines, restrained exterior glow and trails.
- Replace AoE measurement markers locally at animation start, show matching effects over affected cells on impact, and retain them until damage resolution. Add organic inward-fading boundaries and cleanup for deleted templates and ended encounters.
- Restore the VTT-style combat preview using the current animation/audio runtime.
- Refine compact chat layout, skin cycling, custom-color controls and settings organization. Isolate optional visual-effect initialization from core chat/theme features.

Combat-linked effects require compatible Combat Tools APIs. Electrical Shock gameplay activation remains deferred. Local automated checks do not establish complete live Foundry or multiplayer verification.

## 0.4.0

- Add Ultra Compact and Ultra Compact — Pneuma Hub skins, side-by-side opposed rolls, compact damage/ammo rows, smaller controls, and roll-grid overlap fixes.
- Refine chat portraits, interaction gestures, hover details, damage receipts, effect rows, and skin switching.
- Add theme customization with light/dark palettes and personal presets.
- Add scene previews, native audio seeking and soundboard tools, and Escape behavior improvements.
- Keep Neural Intrusion and On Fire full-screen effects disabled.

- Integrate procedural attack visuals and synthesized sounds for resolved Combat Tools weapon, AoE, grapple, and netrunning actions, with client controls, privacy guards, and history/replay protection.

## 0.2.0

- Enable chat-card skinning and integrated dice replacement.
- Gate unfinished attack effects, neural intrusion glitches, and On Fire playback out of initialization. Their settings are hidden and their hooks never register; source and assets are retained.
- Move compact chat cards from Combat Tools: portraits, thin stock-color frames, collapsible recipients, dice sizing and master switch.

## 0.1.0

- Initialize the Foundry v12 TypeScript module scaffold.
- Add source validation, a flat dist build, and CI checks.
