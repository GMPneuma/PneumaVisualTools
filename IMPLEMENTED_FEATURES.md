# Implemented Features

## 0.2.0 release scope

Only chat-card skinning and dice replacement initialize. Code-only gates in src/release-features.ts disable neural intrusion, attack visuals/audio, and On Fire playback. Disabled modules are not imported or registered: their settings and hooks are absent even if earlier development settings remain saved. All unfinished source and assets remain available for later development.


## Procedural attack effects runtime

- Attack visuals and sounds wait for Combat Tools' `rollsRevealed` completion flag, written after the awaited native dice display. A resolved result alone does not start playback. Requires the matching updated Combat Tools build.

- `weapon-effects.ts` registers independent client visual/audio switches, volume, and intensity. Fresh resolved Combat Tools message updates trigger effects; ready-time history is seeded without playback, and action identities prevent damage/recovery updates from replaying an attack.
- `weapon-effect-events.ts` interprets exchange, revealed area-attack, grapple, grapple-follow-up, and netrunning flags. Shared AoE plays once, after placement and attack reveal. SMG/Rifle automatic modes use representative bursts.
- `weapon-effect-player.ts` supplies the reviewed procedural weapon visuals, physical impacts, Quickhack data arcs, and cached/synthesized sounds. Screen-space overlays follow current token positions through canvas transforms and do not alter token documents or combat state.
- Playback requires visible message content and current-scene participants. Player-hidden tokens, private netrunner identity, and hidden weapon categories are protected. At most eight simultaneous local effects are admitted; stopped/disabled/hidden-tab/scene-teardown effects are cleaned up. Audio requires a user gesture and does not replay cues missed before unlock.
- Coverage includes all 15 reviewed weapon profiles, known ammo colors, browser rendering/audio cleanup, old history/deduplication, privacy, scene guards, independent sound/visual controls, and reduced motion. Live Foundry multiplayer validation remains pending.

## Procedural pistol concept preview

- Quickhack hits use angular brackets, scan flashes, and rectangular fragments. Physical hits use directional bullet chips, splitting blade cuts, blunt compression waves, interlocking grapple arcs, or irregular explosive pressure fronts. Muzzle flashes retain their existing shape. Netrunner Quickhack adds a curved stream of data packets with procedural digital audio and a red rejection cue for failed attempts.

- Expanded manual preview includes SMG, Shotgun, Sniper Rifle, Bow, Crossbow, Grenade Throw, Rocket, Melee, Sword/Blade, Punch, Grapple, and Martial Art Attack. SMG and Rifle expose Autofire and Suppression modes with representative 5-shot bursts and 8-shot area spreads. Melee uses neutral physical effects without ammunition selection. All choices have procedural launch and outcome sounds.

- `docs/bullet-animation-preview.html` provides a standalone manual pistol preview: attacker recoil/muzzle flash, bullet travel, target hit effects, and misses that pass the target to a backstop.
- Basic, Armor Piercing, Incendiary, Expansive, Rubber, and Smart ammunition have proposed colors and procedural impact variants.
- The gun selector offers Pistol and Rifle. Rifle uses a larger muzzle flash, faster and longer narrow tracer, stronger recoil/impact sparks, and a fuller procedural report with a longer tail. Both support all ammo colors and hit/miss outcomes.
- Web Audio synthesizes shot, travel, and hit/miss cues without external sound assets. Volume, mute, stop, slow motion, reduced motion, and hidden-tab cleanup are supported.
- Revised gun reports use cached procedural broadband cracks, low/mid blast layers, pressure transients, and short reflections. Rifle has a longer blast/tail than Pistol; travel and impacts use restrained noise cues rather than prominent pitch sweeps. Generated gun-report buffers are peak-normalized.
- This preview is not connected to Foundry attacks or multiplayer playback. `scripts/pistol-preview.test.mjs` checks each ammo/outcome, audio scheduling and cleanup, and local controls; sound quality requires listening review.

## Chat cards

- Rail action labels use base-form action names: Attack, Grab, Break Grapple, Release, Choke, and Throw.

- Jack In/quickhack participant rails retain the target name from visible message content and use the existing permission-checked target portrait or fallback. Private-message visibility and concealed attacker names remain intact.

- Damage application sections have a visible boundary after the damage roll. Multiple receipts use separated recipient entries, with Undo beside the applied total and Cover Up/injury notes grouped beneath their recipient.

- Default-on client setting **Compact chat cards** applies during initialization to saved history and new visible messages. The master switch requires reload.
- Two client skins: **Pneuma Hub** (`cyberpunk`, default) and **Cyberpunk Minimal** (`technical`). Alt+Shift+C cycles them. Switching changes mutually exclusive classes without rebuilding cards, rerolling, or changing controls and drafts. Legacy Header selections display Hub; legacy Native selections display Minimal.
- Shared layout: 76px shaded participant rail beside the full right-column header and opening rolls. The rail reaches the bottom of the opening area, stopping only before a later full-width section. Privacy and timestamp/delete tabs sit above the card.
- Participants appear as portrait, name, action, target name and 48px target portrait. GM/world settings choose token or actor artwork and an optional fallback. Missing artwork stays blank; names fit down to 11px, then wrap at spaces with a full-name tooltip.
- Full right-column headers have consistent typography, stepped dividers and weapon masks or action symbols. Compact skill/stat/role headers suppress duplicate labels. Plain chat has no action banner. Native action controls remain usable.
- Single D10s retain square proportions; critical pairs overlap diagonally. D6 groups balance into centered rows with at most five dice per row. Major totals are fixed 46px wells with 32px text; secondary results are 32px wells. Single- and double-digit values use the same geometry.
- Attack and defense share the right-hand frame. Hub has normal dark roll backgrounds, cyan totals and cropped green/red outlines. Minimal has tinted outcome rows, edge stripes and neutral panel totals with native text and outcome-colored outlines. Outcomes come only from published semantic classes. No Winner/Loser labels are generated.
- Opposed dividers are 1px: Hub uses the centered 84% of the right frame, Minimal uses its full width. Nested grapple and quickhack roll wrappers have no intervening blank gutters.
- Hit/miss bars, damage, application, attached effects, recovery and AoE target sections use the full card width where published as separate sections. Their native controls, delegated event ancestry and busy/disabled states remain intact.
- Combat Tools owns active-grapple explanations and their updates. Visual Tools places the existing bulleted section below the opening area; it does not parse or generate grapple rules text.
- Minimal reads the active CPR card, text, block, panel and semantic outcome variables. Its rail mixes the card surface with 8% black; headers, silhouettes, privacy tabs, result frames and compact results follow the native palette. Effect-icon buttons use charcoal for icon contrast. Hub retains its fixed dark cyan/amber palette.
- Privacy recipients reveal on hover/focus or click; clicking pins them and Escape closes them. Existing privacy guards are retained; hidden or unavailable content is not reconstructed.
- Supported totals reveal existing saved breakdowns on hover/focus/click, without expanding the card. Visible dice are not repeated; missing/private data is not inferred. Native inline rolls, applied damage, effect resistance and undo controls are supported.
- Weapon art uses 21 replaceable 512×256 transparent WebP masks. Visible saved titles or accessible matching item categories choose the asset; concealed generic titles disclose no category.
- Shared composer geometry follows the selected palette and preserves draft text and the native roll-mode selection.
- Result hover breakdowns use right-aligned text and tabular numerals in both themes. Hub GM controls share Roll Damage's dark brown surface, amber text and amber border, including an amber-tinted hover state; Minimal retains native control colors.

## Maintainable presentation structure

- `src/chat-cards.css` owns all card/composer geometry and component rules.
- `src/chat-hub.css` and `src/chat-theme.css` contain appearance variables only; neither contains layout declarations or `!important` overrides.
- `arrangeCardSections` in `src/chat-presentation.ts` marks opening rows and transparent flow wrappers without moving native workflow sections. Additional flow children default to full width. The existing observer refreshes annotations on additions and removals.
- `src/pneuma-visualtools.css` contains only screen effects. The manifest and cached-manifest fallback load the separated chat files.
- The layout contract and extension guidance are documented in `docs/chat-skins.md`.

## Neural Intrusion screen effects

Optional player screen distortion uses four localized styles and three strengths, with one or two regions totaling 10–24% of the screen. Bursts last 1.8 seconds, initially after one second and then after 6–10-second pauses. The client setting stops effects immediately; reduced motion and hidden tabs suspend them. Without the active Combat Tools integration API, no glitches run. Jack-In mechanics, statuses, detection and ejection remain in Combat Tools.

## Validation and packaging

Strict TypeScript, Foundry v12 definitions and flat generated `dist/` output. Browser fixtures cover both themes at 260/300/400px; matching geometry; light, dark and custom native palettes; privacy; native/delegated controls; busy states; roll hovers; late sections; nested opposed rolls and grapple section boundaries. Theme ownership is checked through the browser CSS parser. Live Foundry and third-party skin verification remain separate; no v13 compatibility is claimed.


## Built-in chat dice replacement

- Independent client master switch, enabled by default; the default set is Pneuma's existing 31-image artwork. Roll mechanics and values remain native.
- Client selection from a GM-managed world list of named custom folders. Native settings menu supports folder browsing, common-format selection (WebP/PNG/SVG), availability validation, addition and removal. Players can select sets but cannot change the shared list.
- Predictable filenames and a downloadable complete template ZIP. Custom images fall back to bundled images, then native images; disabling restores native paths. Switches apply to existing messages immediately.
- Standard and critical D10 faces/symbols, standard D6 faces and multi-six PREEM damage mapping are preserved. Secondary popup dice use the same selection service; cloned images retain original paths for master-switch restoration.
- Child-list observation covers late-added dice. Native-only chat cards receive the missing d6-60 size rule independently of the skin master switch. All runtime assets remain flat in dist.
- Browser fixtures check asset presence, face mapping, PREEM rules, custom set selection, missing-image fallback, restoration, cloned/late dice and GM menu permissions. Existing chat-card geometry/control tests pass. Live Foundry menu rendering remains a separate check.
- Disable the older standalone Pneuma Chat Dice module when using this integration.

## On Fire screen effect

Transparent prerendered VP9 WebM flames use a 900×270, 30 FPS, eight-second blended loop, generated from the retained procedural renderer. Playback contains no heat simulation or JavaScript animation loop. Mirrored sections preserve flame proportions on wide screens and remain behind Foundry controls. Mild/Strong/Deadly statuses change opacity. One controlled visible owned token takes precedence over the assigned character. Disabled/suppressed effects are ignored; Combat Tools is not required.

The client toggle, status removal, hidden tabs, and canvas teardown stop playback and release media sources. Reduced motion and playback failure use a static transparent poster. Build copies both media assets directly into dist. Browser checks cover playback, native status lifecycle, repeated start/stop, 4K proportions, and reduced motion; live Foundry CPU and stability remain unverified. Multiple sections require multiple video elements, so decoder/compositor cost grows with viewport width.

The procedural source is retained only for offline regeneration through scripts/render-fire-loop.mjs (FFmpeg path argument), and is not used by the runtime effect.

Headless Edge at 3840×2160 measured main-thread task time over ten seconds: procedural 0.319 s, video 0.018 s. These measurements exclude media-decoder and GPU work and do not establish total client CPU savings. The video is approximately 4 MB.
