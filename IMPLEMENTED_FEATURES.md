# Implemented Features

## Custom color theme

- Client-local **Custom color theme → Customize colors** menu provides **Simple Recolor** (one color generates eight related shades for both light/dark palettes) and **Manual Colors** (eight color pickers and hex inputs per palette).
- Appearance follows Foundry/CPR or forces Light/Dark. Opening the editor starts a client-only live preview: real sheets, dialogs and other native components recolor immediately. Light/Dark palette buttons force that mode for preview; the saved Appearance setting takes effect on Apply. **Apply Theme** explicitly enables and saves the theme; **Cancel** or closing the editor restores the saved palette. **Use system colors** disables the saved custom theme. Each palette can be reset independently.
- Three built-in Pneuma presets (Green, Cyan, Violet) and exactly three named personal slots. Slots are saved in the current player's User flags, with both palettes, and remain independent across players and browsers. Loading previews a preset; saving a slot does not apply it. No synthetic preview apps, actor copies or documents are created.
- Generation adjusts accent lightness for the checked foreground/background pairs; manual edits retain exact colors and show low-contrast feedback. Foreground text on editable fills is derived automatically; neutral surfaces remain fixed per mode.
- Uses native CPR palette hooks and color-only component overrides. Native aliases are defined alongside palette values on both html and body so root-resolved divider/icon/tab colors follow the custom palette. Success/failure colors remain semantic. No native sheet geometry or chat DOM changes. Native/Minimal chat follows the custom palette; Hub retains its own palette. The separate Green Theme module is not required; its additional spacing/sizing overrides remain if users keep it enabled.
- Build and `scripts/theme-customizer.test.mjs` cover generated contrast, fixed neutrals, recoloring with native CPR v0.92.4 CSS, root aliases, unchanged native bounds, eight manual controls, independent light/dark palettes, Apply enabling, Cancel/window-close restoration, mode observation, disabling, three built-ins, three personal slots and player isolation. Live Foundry validation remains pending: the browser debugger could not attach to the server tab.
- The broader chat-card suite currently fails its existing Minimal damage-button text-color assertion (`rgb(181, 32, 32)` versus `rgb(25, 25, 25)`, `scripts/chat-cards.test.mjs:349`); that fixture does not load the customizer module or stylesheet.

## 0.2.0 release scope

Chat-card skinning, dice replacement, compendium scene previews, native audio tools and procedural attack visuals/audio initialize. Code-only gates in src/release-features.ts disable neural intrusion and On Fire playback. Disabled modules are not imported or registered: their settings and hooks are absent even if earlier development settings remain saved. All unfinished source and assets remain available for later development.


## Procedural attack effects runtime

- Attack visuals and sounds wait for Combat Tools' `rollsRevealed` completion flag, written after the awaited native dice display. A resolved result alone does not start playback. Requires the matching updated Combat Tools build.

- `weapon-effects.ts` registers independent client visual/audio switches, volume, and intensity. Fresh resolved Combat Tools message updates trigger effects; ready-time history is seeded without playback, and action identities prevent damage/recovery updates from replaying an attack.
- `weapon-effect-events.ts` interprets exchange, revealed area-attack, grapple, grapple-follow-up, and netrunning flags. Shared AoE plays once, after placement and attack reveal. SMG/Rifle automatic modes use representative bursts.
- `weapon-effect-player.ts` supplies the reviewed procedural weapon visuals, physical impacts, Quickhack data arcs, and cached/synthesized sounds. Screen-space overlays follow current token positions through canvas transforms and do not alter token documents or combat state.
- Playback requires visible message content and current-scene participants. Player-hidden tokens, private netrunner identity, and hidden weapon categories are protected. At most eight simultaneous local effects are admitted; stopped/disabled/hidden-tab/scene-teardown effects are cleaned up. Audio requires a user gesture and does not replay cues missed before unlock.
- Coverage includes all 15 reviewed weapon profiles, known ammo colors, browser rendering/audio cleanup, old history/deduplication, privacy, scene guards, independent sound/visual controls, and reduced motion. Live Foundry multiplayer validation remains pending.

## Close-combat visual upgrade

- Melee uses a shaded weighted baton with grip detail; swords use a curved katana with a compact round guard and highlighted cutting edge. Brawling uses a rounded, shaded bare fist and forearm. Martial arts uses a shaded open-hand strike with separated fingers, thumb and palm creases. Its 864ms wind-up/strike gives the hand more time to read.
- Weapon/limb silhouettes and contact effects are 20% smaller. Four close-combat profiles have a wind-up, accelerated strike and fading recovery. Contact effects use larger directional compression waves or splitting blade cuts. Misses pass clear without contact effects. Reduced motion retains stationary hit cues.
- Runtime and standalone preview use matching strike renderers, checked by a parity assertion. Build, the full weapon-preview/runtime browser fixtures, and focused four-profile hit/miss checks pass. Live Foundry validation remains pending. Combat visuals/audio are enabled in the current module build; clients retain independent visual/audio switches.
- Review image: docs/close-combat-upgrade.png. Open docs/bullet-animation-preview.html?weapon=blade to review the animation and select the other profiles.

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
- Four client skins: **Pneuma Hub** (`cyberpunk`, default) and **Cyberpunk Minimal** (`technical`), **Ultra Compact** (`compact`), and **Ultra Compact — Pneuma Hub** (`compact-hub`), plus **Visual Tools OFF**. Alt+Shift+C cycles all five. Ultra Compact uses Minimal colors, a 56px rail, 36px actor portrait, hidden target portraits, 36px D10s, 28px D6s, 30px major totals and tighter spacing. Switching between enabled skins changes mutually exclusive classes without rebuilding cards; transitions through OFF recreate mounted cards through native rendering while retaining the composer and drafts. Legacy Header selections display Hub; legacy Native selections display Minimal.
- Shared layout: 76px shaded participant rail beside the full right-column header and opening rolls. The rail reaches the bottom of the opening area, stopping only before a later full-width section. Privacy and timestamp/delete tabs sit above the card.
- Participants appear as portrait, then four stacked text rows: actor name, down arrow, action, and target/object name, followed by the existing 48px target portrait. Only the second arrow between action and target is removed. GM/world settings choose token or actor artwork and an optional fallback. Missing artwork stays blank; names fit down to 11px, then wrap at spaces with a full-name tooltip. Ordinary chat and generic rolls retain their name-only identity.
- Full right-column headers have consistent typography, stepped dividers and weapon masks or action symbols. Compact skill/stat/role headers suppress duplicate labels. Plain chat has no action banner. Native action controls remain usable.
- Ordinary OOC, IC, emote and whispered chat show the speaker portrait, falling back to the author's assigned character and then their user avatar when no speaker actor is saved. The configured token/actor preference and final fallback image still apply. These author fallbacks do not infer identities for system or combat cards. Invisible and blind-message guards remain in place. Focused browser checks cover both skins, real image loading, author/viewer separation and empty/default artwork.
- Actor portraits in the participant rail support hold to ping (native 500ms duration), double-click to open the sheet, and Shift-click to pan. Single-click does nothing. Enter/Space open the sheet; Shift-Enter/Space pan. Author-avatar-only portraits remain decorative. Document resolution occurs on interaction; sheet permissions, ping permissions, token visibility and the current scene are rechecked each time. Dragging, leaving, early release, cancellation and removed cards prevent held pings. The same controls apply to saved defender portraits. Build and focused browser fixtures pass; live Foundry verification remains pending.
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

## Compact area chat cards

Tighter target rows, area toolbar, rules notes and damage receipts. Reset/exclude controls expand through a keyboard-accessible Target controls disclosure; pending responses and recovery controls remain visible. Receipt labels omit the repeated Damage prefix. Application boundaries, totals, undo and recipient notes remain. Damage dice use available width without a five-die cap. Participant rail dimensions remain unchanged.

Attack and defense opening sections use tighter vertical padding; the Evasion heading uses 12px text. Participant rail and dice dimensions remain unchanged.

Combat Tools owns lower damage/application/effects sections. The adapter supports effect-generated damage rows inside `.pneuma-instant-damage`, preserving roll breakdowns and native controls.

Combined AoE recipient rows retain inline effect results/actions and compact damage receipts without repeating the recipient name. Shared styles keep portrait/name/damage on the first line and individual named, color-bordered effect rows underneath; native roll/undo details remain available.

Combat Tools compact effect rows retain effect glyphs in labeled Apply buttons and plain completion icons. Resistance/application and the far-right GM menu have reserved positions; Visual Tools preserves this structure and the existing participant rail. Effect-selection locks and extinguishing placement remain Combat Tools behavior.

Target effect rows (2026-10-04, unreleased): Combat Tools owns the stacked damage/effect structure and separate GM overrides. Both skins preserve visible effect names, colored left borders, labeled Resist/Apply buttons and completion icons. Attached effects share one recipient heading; the participant rail is unchanged. Browser geometry and source checks do not establish live Foundry verification.
Direct GM actions and icon contrast (2026-10-04, unreleased): target controls no longer gain a submenu; saved disclosure wrappers are flattened while preserving handlers. Minimal uses dark effect images, Hub uses a cyan tint. Glyph, selection and completion images remain the original status assets. Supersedes the earlier disclosure behavior; live Foundry verification pending.
RTD resistance details (2026-10-04, unreleased): compact effect totals expose saved calculation text on hover or keyboard focus, including full-width sibling disclosures supplied by Combat Tools. Visible effect names remain; resistance labels belong in the hover.

Applied-damage details (unreleased, 2026-10-04): applied totals expose saved recipient breakdowns on hover or keyboard focus. Undo remains an actionable control beside its total. Existing DOM ancestry and saved calculation content are preserved.
- Right-aligned resolution actions (2026-10-04, unreleased): Combat Tools now collapses empty GM slots and sizes action groups to their contents; visible GM controls are right-most, and completed effect icons/applied totals reach the right edge. Both skins retain the Combat Tools layout and full-width expansion contract. Automated browser verification; live Foundry verification pending.
- Effect selection icon correction (2026-10-04, unreleased): Combat Tools selection images are transparent glyphs, with tinting applied independently of the normal themed button surface. Minimal uses dark glyphs; Hub retains cyan tint. Nested image wells no longer render as solid rectangles. Automated browser checks; live Foundry verification pending.

Roll details and section rails (2026-10-04, unreleased): all recognized native and compact roll totals support hover/focus details, including AoE effects and totals with empty modifier disclosures. Missing saved breakdowns show the saved total only. Resist and effect-damage result labels move into the hover; effect names and pending action buttons remain visible. Damage, Apply and Effects headings use a thin left rail with rotated text. Focused browser checks cover both skins at 260/300/400px; build and TypeScript checks pass. Live Foundry verification pending.

Effect hover and compact-result refinement (2026-10-04, unreleased): Combat Tools native disclosure markers no longer suppress Visual Tools hover listeners; registration is tracked per DOM element. Native-marked resistance and damage, moved sibling breakdowns, and totals without saved roll HTML are covered by browser checks. Effect totals are 24px tall with smaller type and no visible Resist prefix: resistance uses an outlined rounded shield-style box and shield icon, while damage uses a filled square and droplet icon. Lower section rails have tinted backgrounds and inset borders. Both skins pass at 260/300/400px, including native CSS loaded after Visual Tools and keyboard focus/Escape. Live Foundry verification remains pending.

Hover formatting (2026-10-04, unreleased): roll popovers use a short contextual header and horizontal rule above their breakdown. All nested content, including native receipt text and dice rows, aligns right. Copies remove blank wrapper elements, redundant HTML breaks, and blank calculation lines without changing saved card details; resistance skill labels are not duplicated. Build, TypeScript, and focused browser checks pass, including conflicting native CSS and inline left alignment. Live Foundry verification pending.

Damage section layout (2026-10-05, unreleased): lower rails use 13px type, zero label padding, and explicit section/rail separators. Nested damage sections lose their outer inset so their rail aligns with Apply. The repeated native Damage heading is hidden; ammo appears on the left of the effect-control footer, with Add Effects controls on the right, and Basic is hidden. Cover Up explanations move into the recipient's captured damage breakdown while its saved math and controls remain intact. AoE defenders default to collapsed after a damage total appears and can be reopened; adapter reruns retain that choice, and removing the damage roll restores the visible list. Browser checks cover both skins at 260/300/400px, ammo changes, retained recipient math, and native action visibility. Build and TypeScript pass; live Foundry verification pending.

Effect dice hover restoration (2026-10-04, unreleased): Visual Tools uses preserved native rendered HTML from compact effect disclosures to show actual saved dice faces, including D6 artwork and configured dice styling. Headers, separators and right alignment remain. Integration checks run the actual Combat Tools conversion and verify saved 3/1/3 faces, unchanged total 7, and both skins at 260/300/400px. Live Foundry verification pending.

AoE response-stage collapse (2026-10-04, unreleased): the Defenders disclosure includes the GM area controls and cover/terrain note. Reopening reveals all response-stage controls together. Removing the damage roll restores these controls and text to their original stage outside a disclosure. Native control nodes and handlers are retained. Build, TypeScript, and focused browser checks pass; live Foundry verification pending.

AoE receipt alignment (2026-10-04, unreleased): remove the redundant inner divider above the first applied recipient while retaining the outer section boundary. Reversal status is anchored immediately left of the receipt totals; damage, location and Undo positions remain stable. Recipient-name space accounts for the status. Browser checks verify identical total x positions before and after reversal at 260/300/400px in both skins. Live Foundry verification pending.

Visual Tools OFF skin (2026-10-04, unreleased): Shift-Alt-C cycles Pneuma Hub, Cyberpunk Minimal, and Visual Tools OFF. OFF restores native cards using ChatMessage.getHTML for mounted cards in the sidebar and popouts; ChatLog.render is not used because v12 skips rendering an already mounted log. The composer and drafts remain in place. OFF suppresses Visual Tools dice replacement. Cycling again re-enables Hub without changing the underlying chatCards setting. Enabled-to-enabled changes retain existing card nodes. The shortcut uses priority precedence and consumes both keyboard phases while the master setting is enabled. Queued presses await card restoration. Build, TypeScript and a browser fixture using actual v12 KeyboardManager dispatch cover the full cycle, an overlapping normal-priority selection action, native DOM/dice restoration, re-enable, popouts, mounted-only refresh, preserved native handlers and rapid presses. The keyboard fixture requires local Foundry source through PNEUMA_FOUNDRY_SOURCE (or its temporary cached source). Live client verification pending.

Collapsible damage roll (2026-10-04, unreleased): the damage-roll rail is a keyboard-accessible toggle. Sections start expanded; collapsing hides the saved roll and ammo/effect-control footer behind a compact horizontal Damage label, without hiding application receipts or effects results. Expanding restores the same native DOM and controls. Adapter reruns preserve the selected collapse state. Build, TypeScript and browser checks pass; live Foundry verification pending.

Damage collapse rail refinement (2026-10-04, unreleased): retain the shaded vertical Damage label. A separate transparent arrow button sits at the top of the left rail, using the card ink rather than native button surface colors. Collapsed sections retain the shaded rail and a compact horizontal label. Browser checks verify placement and transparent button treatment in both skins.

## Compendium scene previews

- Hovering Scene entries in native compendium windows shows an enlarged saved thumbnail, scene name, pixel dimensions, grid type/size and distance scale after 250ms. Documents load on demand without importing or changing scenes. Leaving, dragging, scrolling, closing, resizing or Escape dismisses the preview; stale asynchronous loads are ignored. Live Foundry validation remains pending.

- Preview image dimensions are doubled (800px content width, up to 600px height), constrained to the viewport. Two detail columns show dimensions and Image/Animated on the left; grid type, size and scale on the right. Animated classification uses the scene background extension (WebM, MP4, M4V, MOV, OGV, OGG or GIF), ignoring query strings and fragments.

## Native audio tools

- Currently Playing has a separate seek bar with -20s/+20s buttons. Native volume and native track time remain. GM seeking refreshes every 500ms, preserves drag interaction, and clamps to track boundaries.
- Playlist configuration includes an explicit Include in VT-Soundboard checkbox. Only checked, visible Soundboard Only playlists appear. Native playback mode and audio channels retain their existing behavior.
- VT-Soundboard is a compact 300px translucent Foundry window using Combat Tools panel surface tokens. Existing playlist folders and their ancestors form a nested native folder tree; expanding a folder reveals its sound tiles in three columns. It uses the native playlist directory folder toggle handler and native expansion state. Unfiled playlist sounds appear at the root.
- Sound tiles show optional images, names, playing indicators and description tooltips; click plays through the native playlist. No mixer or transport controls appear in VT-Soundboard. Sound configuration includes a description and image path with native image FilePicker.
- The redundant Audio category field and custom category mixer are removed. Native audio channels and volume controls govern routing and volume; previously saved custom category values are ignored.
- The standalone Audio Tools window and launcher are removed. VT-Soundboard uses the native music sidebar footer button styling. Build and browser fixtures cover sidebar seeking, opt-in eligibility, three-column geometry, nested folder grouping, native folder handler dispatch, keyboard toggling and translucent styling. Live Foundry folder rendering/config persistence and multiplayer playback remain unverified.
- Include in VT-Soundboard is available only in Soundboard Only mode and responds immediately to changing the native mode selector. The picker requires both that mode and the inclusion flag; saved flags on other modes are ignored.

- VT-Soundboard clicks play once from the beginning, ignoring saved Repeat for that playback. A shared module flag tells each client to disable looping on the runtime Sound; saved Repeat is unchanged. Subsequent native playback clears the marker and honors native Repeat. Browser fixtures cover one-shot behavior, preserved Repeat, playback-start loop enforcement and native-play reset; live multiplayer remains unverified.
- VT-Soundboard is now 220px wide with approximately 65px square tiles, three across, and tighter folder spacing. Alt+Shift+S toggles it (remappable in Configure Controls); the token controls speaker button and Playlists VT-Soundboard button provide click access.

- VT-Soundboard constrains folder/tree/grid/tile widths to the available window content width; long folder names truncate and horizontal scrolling is disabled.
- Seeking and skipping use native document updates with render:false and a shared seek-operation marker. Seek hooks update progress and tile playing indicators in place instead of rebuilding VT-Soundboard, while preserving one-shot playback state. Fixtures verify seeks do not invoke window renders; live Foundry/multiplayer redraw behavior remains unverified.
- The VT-Soundboard launcher sits at the very top of the music sidebar header, retaining native button styling.
- Folder widths are automatic and native folder margins/padding are reset; indentation lives only inside folder contents so each nested grid sizes to its available width. Browser fixtures verify three nested expanded folders have no horizontal overflow despite native-style indentation rules.
- Expanded folders use natural content height inside one vertically scrolling window-content container. The scrollbar gutter is reserved so tiles retain three columns when scrolling is needed. Browser fixtures verify overflowing folders scroll vertically without horizontal overflow.
- Soundboard hover uses the saved soundboard description, falling back to native sound description; it never substitutes the sound name. The description is supplied to the native Foundry tooltip and browser title.
- Seeking keeps the range enabled visually and guards repeated input using a busy marker. Cached audio duration prevents the slider maximum from collapsing to zero while a streamed sound restarts. Browser fixtures simulate missing duration/currentTime during restart and verify the same slider node retains its range and position.
- Tile hover uses native Sound Description first. Empty legacy soundboard-description metadata cannot mask it; nonempty legacy descriptions remain a fallback. The duplicate Soundboard description field is removed. Fixtures cover native description with an empty legacy flag.
- Compendium hover preview is reduced to 400px image width/up to 300px height. View full image opens the actual scene background source in native ImagePopout. Preview supports mouse/focus interaction with delayed dismissal when moving from its compendium row.
- Clicking the compendium preview image (or Enter/Space) opens the actual scene background in a native ImagePopout sized to 90% of the viewport and centered. The pop-out uses a dark translucent VT panel theme instead of white surfaces and remains resizable.
- Clicking a Scene entry name or thumbnail in the main compendium opens its full background at 75% of the current canvas/viewport dimensions. Hover preview is view-only again with no button or image click action.
- Native sidebar and compendium pop-outs ignore Escape close-all requests. Their native X buttons and explicit/programmatic closes still work; character sheets and other windows retain native Escape behavior. Protection wraps each rendered sidebar/compendium instance once.
- Escape protection now allows the currently focused native sidebar/compendium to close. Background pop-outs remain open. Focus is captured when Escape is pressed so native close-all processing cannot shift focus and close additional protected windows.
- Escape protection listens to native renderSidebarTab and renderCompendium hooks because Foundry base-class hook dispatch may omit renderApplication. Native front-window tracking takes precedence over stale DOM input focus after clicking a title bar. Tests dispatch only native sidebar/compendium hooks and cover title-bar focus.
- Escape now closes only the frontmost current window universally, including skill dialogs, character sheets, native sidebar/compendium pop-outs and framed ApplicationV2 windows. Each Escape snapshots native window registries and frontmost z-index before native close-all runs, so background parents stay open. Native context menu/tour/canvas/menu dismiss sequencing and explicit X/programmatic close operations remain intact. Targeted tests cover dialog-over-sheet, repeated Escape, modern windows and custom base render hooks; live Foundry validation remains pending.
- Escape on an empty canvas no longer opens the native logout/settings menu. Window closing, context-menu dismissal, tour dismissal and native GM deselection continue normally. Targeted tests cover the idle-canvas suppression and those exceptions.
- Default-on client master setting Fix Escape Key controls both focused-window-only closing and idle-canvas menu suppression. Its hint matches the requested wording. Switching it off restores native Escape immediately without reload; tests cover native close-all and idle-canvas passthrough when disabled.
- Privacy/timestamp tabs meet the card top edge; the former 2px metadata offset is removed.

Ultra Compact (2026-10-06, unreleased): third enabled skin, using the Minimal palette with reduced component sizes and hidden target portraits. Build/TypeScript, all-three-skin rail checks at 260/300/400px, and native keyboard skin cycling pass. Full chat regression still stops at the existing button-color assertion (chat-cards.test.mjs:349). Live Foundry verification pending.

Ultra Compact opposed rolls (2026-10-06, unreleased): attack/evasion, grapple and paired QuickHack rolls appear side-by-side with a vertical divider. Each column places dice left and the total right. Hub and Minimal retain stacked opposed rows. Native wrappers and controls remain intact. Browser placement and overflow checks pass for all three skins at 260/300/400px; live Foundry verification pending.

Ultra Compact dice placement (2026-10-06, unreleased): explicitly place D10 dice and total cells, reset native image positioning, and use a reduced 48px diagonal critical-pair grid. Browser checks verify single/pair 36px dice, dice left of totals without overlap and no clipping at 260/300/400px. Live Foundry verification pending.

Ultra Compact opposed alignment (2026-10-06, unreleased): dice remain left of results; critical pairs use a 48px diagonal footprint. Matching attack/defense label bands and 48px dice rows align single and critical dice regardless of the Evasion heading. Browser checks pass at 260/300/400px.

Ultra Compact controls (2026-10-06, unreleased): reduce standard buttons to 24px with 11px type and 2px/4px padding; Roll Damage uses a 26px minimum height. Major result squares are 30px with 22px type, receipt wells 24px, effect totals 28x22px. Other skins retain their dimensions.

Ultra Compact header separator (2026-10-06, unreleased): replace the angled divider with a straight 1px line using the current card border color and remove the grey header dots, hatch marks and bars. Other skins retain their header decoration.

Ultra Compact Damage/Apply spacing (2026-10-06, unreleased): reduce section gutters to 2px vertical, damage block/footer spacing to 1px, remove nested application-control padding, and tighten recipient/receipt gaps. Section rails, application boundaries and controls remain intact.

Ultra Compact multi-target density (2026-10-06, unreleased): zero damage-to-ammo footer margin, 2px damage-dice row gaps, 24px recipient/effect rows, 20px recipient portraits, 1px effect gaps/padding, and 2px recipient separators. Native receipt disclosure and application ancestry remain intact.

Ultra Compact damage row (2026-10-06, unreleased): ammo moves into the left roll cell; balanced damage dice and result align right. Damage stays expanded with no collapse control. Switching to another skin restores ammo to its footer and recreates the collapse control. Existing ammo/control nodes retain identity.

Ultra Compact damage spacing correction (2026-10-06, unreleased): add 2px horizontal space to balanced damage dice tracks, use a 90px dice group, allow native damage grid rows to size to content, and hide footers containing only empty effect slots.

Ultra Compact damage dice refinement (2026-10-06, unreleased): damage dice increase to 32px with 2px horizontal separation; the right-aligned group is 102px wide. Damage sections have a 50px minimum height so the vertical label fits.

Ultra Compact damage rows (2026-10-06, unreleased): up to five damage dice stay on one line; larger pools use balanced rows with at most five dice per row. The right-aligned group grows with the dice count, reducing face size only when available card width requires it.

Ultra Compact roll-grid coverage (2026-10-07, unreleased): apply the explicit dice-left/total-right grid to every native D10, D6 and generic roll, including medical, skill, role and ordinary cards. Previously only opposed workflow wrappers received the grid definition although dice/total cells were assigned universally, allowing mismatched native grid areas to overlap. Damage/ammo three-column rules retain precedence.

Ultra Compact — Pneuma Hub (2026-10-07, unreleased): additional skin selection using Hub colors with the existing Ultra Compact layout, plain border-colored separator, hidden target portraits and always-expanded damage. Existing Ultra Compact retains native colors.

Release 0.4.0 (2026-10-07): includes current chat, themes, audio, scene previews, Escape handling and procedural combat effects. Neural Intrusion/On Fire gates remain false; their runtime files/media are omitted from the release ZIP. Build and focused feature/browser checks pass. Broad chat regression reaches the legacy popup-frame assertion and stops at chat-cards.test.mjs:443; full-suite success and live multiplayer verification are not claimed.
