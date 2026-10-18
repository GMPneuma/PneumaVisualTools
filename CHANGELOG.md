# Changelog

## 0.8.1 - 2026-10-18

- Rename the soundboard and related controls to Visual Tools - Soundboard.
- Give hazard chat cards full-width sections and a Hazard header label.



## 0.8.0 - 2026-10-14

- Add Rocket Match target area alongside the existing Grenade option in Attack flash lighting.
- Match the rocket impact flash to the target area: Bright reaches the edge and Dim extends 2 scene units farther. Keep the small projectile light during travel and expand at impact.
- Save grenade and rocket matching independently; disable matching to use manual Bright/Dim radii. Matching defaults on, with Bright 5 / Dim 7 when blast geometry is unavailable.
- Record optional suppressor sound softening as a future idea after v13 support; it is not implemented in this release.

Validation: strict TypeScript/build and focused lighting/settings regressions. Live Foundry/multiplayer verification remains pending.

## 0.7.1 - 2026-10-14

- Add native Ambient Light flashes synchronized with gunfire, shotgun blasts, grenade impacts and rocket travel/impact. Reuse a bounded light pool with local pulses instead of per-bullet server writes.
- Add GM attack-lighting controls: master enable switch, Provides Vision (off by default), and separate color, intensity and bright/dim radii for Gunfire, Shotgun, Grenade and Rocket.
- Add optional matching to animation ammo colors and grenade target-area size. Rocket lights follow the actual projectile path and expand at impact.
- Allow public vision-providing flashes outside current player vision without revealing projectile artwork or playing attack sounds for unseen attacks. Preserve hidden-token, private-message and reduced-motion restrictions.
- Keep public weapon-category effects visible when Combat Tools hides NPC weapon names.
- Handle delayed light delivery, overlapping attacks, cancellation, scene teardown and interrupted-light recovery; refresh the generated previews.

Validation: strict TypeScript/build and targeted lighting, settings, lifecycle, audio and rendering checks. Live Foundry wall occlusion, vision appearance and multiplayer performance verification remain pending.

## 0.7.0 - 2026-10-14

- Repair Fix Escape Key handling: ignore persistent panels and detached application roots when detecting popups, and capture Escape before Foundry's document handlers. Preserve native popup, token, context-menu and tour dismissal.
- Fade gunshot buffers to exact silence over their final 200 ms to prevent abrupt audio endings.
- Add distinct cached stereo grenade and rocket blasts with pressure transients, bass impact, reflections and longer decay: 2.6 seconds for grenades and 3.2 seconds for rockets.
- Strengthen rocket launch audio and refine spatialized debris accents.
- Update combat previews to use the revised audio and allow explosion tails to finish during Play All.

Validation: strict TypeScript/module build and focused Escape, offline audio and startup checks. Live Foundry/multiplayer and listening verification remain pending.

## 0.6.1

- Fix missing EMP token and full-screen visuals when the native EMP status is applied manually. Visuals recognize the status as well as existing Combat Tools item disablements.
- Respect status removal, disablement, suppression and expiry. No gameplay state is changed.
- Record the planned Cyberpsychosis effects enhancement in the backlog.

Validation: module build and focused EMP, token, preview and startup regression checks. Live Foundry verification remains pending.

## 0.6.0

- Remove obsolete prerendered fire media and its preview/generation tools, reducing unpacked runtime assets by approximately 4.4 MB. Current procedural fire effects are unchanged.
- Update chat-skin names, hotkey order, effect statuses and release documentation. Reconcile the backlog with outstanding live verification and deferred work.

Validation: TypeScript/module build and focused fire, preview and startup checks. Live Foundry and multiplayer verification remain pending.

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
