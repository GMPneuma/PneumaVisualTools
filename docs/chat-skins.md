# Chat theme structure

## Layout contract

The opening area has two columns: a 76px shaded participant rail and the remaining right-hand frame. The header spans that right frame, with its graphical divider below. Opening roll rows follow it. The rail spans every opening row, including any remaining space at the bottom.

Later sections reclaim the full card width. The rail ends at their boundary. Hub and Minimal share geometry. Ultra Compact adds a scoped density class in the shared layout: 56px rail, 36px actor portrait, hidden target portrait, 36px D10s, 28px D6s and 30px major totals. Target names and controls remain visible. Switching back restores existing geometry.

Action cards retain four stacked text rows: actor name inside `.pneuma-chat-identity`, a single `.pneuma-rail-arrow` containing `↓`, `.pneuma-rail-action`, then the target/object name. Only the second arrow between action and target is removed. The action and arrow are direct participant-rail children; the temporary horizontal `.pneuma-rail-action-line` wrapper and styles are removed. Portrait and rail sizes are unchanged, and the target portrait follows its name. Actor names retain the 11px floor, two-line word wrapping and full-name tooltip. Ordinary chat and generic rolls retain their existing name-only identity. For example, `.pneuma-participant-rail > .pneuma-rail-action` owns the action layout.

Ordinary OOC, IC, emote and whispered messages retain the same `.pneuma-chat-portrait` slot above the sender name. Artwork follows the saved token/actor, then the message author's assigned character, then their avatar, and finally the configured fallback. The existing token/actor preference applies to actor artwork; unresolved wildcard textures and the native mystery-man placeholder remain excluded. Author-based fallbacks are restricted to ordinary non-roll message styles, so system/combat cards retain their existing identity handling. Visibility guards and the OFF/master switches still apply.

Actor-backed `.pneuma-chat-portrait` and `.pneuma-exchange-defender-image` elements carry `data-pvt-portrait-controls="true"`, a button role, keyboard focus and a gesture tooltip. Hold pings using the native long-press duration; double-click opens the actor sheet; Shift-click pans to a visible current-scene token. A single click has no action. Enter/Space open the sheet, with Shift panning instead. Permissions and saved actor/token references are resolved on interaction. Without a saved token, the actor's visible active token is used; an explicit historical token reference never redirects to another token. Avatar-only artwork stays decorative. Both themes use the shared cursor and inset focus treatment, for example `.chat-message.pneuma-chat-card [data-pvt-portrait-controls]:focus-visible`; this does not change portrait dimensions or the rail layout.

| Owner | Responsibility |
| --- | --- |
| `src/chat-cards.css` | Layout, header and rail geometry, dice, result wells, controls, metadata, popovers and composer |
| `src/chat-hub.css` | Hub colors, gradients, clipped-total appearance and decoration |
| `src/chat-theme.css` | Minimal palette mapping from native CPR variables |
| `src/chat-presentation.ts` | Visible-DOM adapters, opening/section annotations, name fitting and saved breakdowns |
| `src/chat-cards.ts` | Settings, visibility guards, portraits and mutually exclusive theme classes |
| `src/chat-portrait-controls.ts` | Portrait gestures, keyboard access and current permission/token checks |
| `src/chat-styles.ts` | Missing stylesheet fallback for cached manifests |
| `src/pneuma-visualtools.css` | Neural Intrusion screen effects only |

## Section placement

`arrangeCardSections` is the single boundary adapter. It marks existing native wrappers with `pvt-section-flow` (`display: contents`), and opening rows with `pvt-opening-row` and a row number. The rail spans row 1 through `--pvt-opening-end`. Unclassified children of a flow wrapper are full-width rows by default.

The damage-roll footer (`.pvt-damage-footer`) places `.pneuma-damage-ammo` first and left-aligned, followed by the right-aligned Add Effects controls (`.pneuma-aoe-effects-picker` or `.pneuma-damage-effects-slot`). Both skins share this order. Basic ammo stays hidden; moving the existing control nodes preserves their handlers. For example, `.pvt-damage-footer > .pneuma-damage-ammo` owns the left alignment.

Lower section rails display **Damage**, **Apply**, and **Effects**. The native `.pneuma-resolution-damage-roll` and `.pneuma-resolution-damage-apply` classes remain unchanged; only their visible labels shorten. Collapsed damage sections also display **Damage**, while the toggle's accessible description still distinguishes collapsing/expanding the damage roll. Saved roll labels and hover breakdowns retain their descriptive wording.

Resolution/AoE opening rows are attack, pending and defense. Their later result, damage, target and recovery sections reclaim the card width. Grapple keeps its native main wrapper beside the rail; Combat Tools' explanation sibling is full width. Simple native cards keep their content beside the rail. Ad hoc damage starts a full-width section after the heading. Quickhack's roll and immediate result remain together in its opening wrapper.

Nested grapple/quickhack rolls own their internal padding. Their outer opening wrapper has no padding, so row paint and separators reach both edges of the right frame. No negative-margin compensation is needed. `pvt-opposed-divider` supplies one shared pseudo-element; its paint is a centered 84% gradient in Hub and a solid native color in Minimal.

Annotations refresh through the existing child-list observer, including section removal. They do not replace workflow nodes or their delegated event ancestors. The adapter does not calculate winners or build grapple descriptions.

## Theme contract

Only one class is active: `pneuma-theme-cyberpunk` or `pneuma-theme-technical`. Theme files set appearance variables only. Layout variables such as rail width, spacing and total dimensions belong to the shared file. Do not introduce per-theme padding, margins, fonts or selector overrides to fix a layout issue.

Hub uses fixed dark surfaces and cyan/amber accents. Opposed totals keep cyan text and cropped red/green outlines. Minimal reads `--cpr-background-chat-card`, `--cpr-text-chat-normal`, `--cpr-background-chat-card-block`, `--cpr-background-chat-card-block-before`, and native success/failure variables, with fallbacks. Third-party skins participate by supplying these variables. Minimal never overwrites those native variables. Its tinted opposed rows and outcome outlines use stable semantic green/red colors for legibility.

Common major totals are 46×46px with 32px text, and compact receipts/effects use 32×32px wells. Digit count cannot change either size. No Winner/Loser labels are generated.

Combat Tools button variables are mapped once in the shared stylesheet. The source module retains state styling and behavior. `!important` is limited to documented native integration needs: inline block surfaces, visibility of relocated/popover sources, conflicting dice sizes, native popup frames, and Combat Tools' important damage-button metrics. Themes contain no important declarations.

## Extending or debugging

1. Identify whether the change concerns placement, component geometry or paint.
2. For a new workflow, map its existing opening and later sections in `arrangeCardSections`. Avoid another card-level `:has()` exception for rail height.
3. Edit the existing shared component rule for geometry. Edit the appropriate theme variable for paint. Keep Hub and Minimal classes exclusive.
4. Preserve hidden content, native action attributes, disabled/busy states and ancestor nodes.
5. Build and run `scripts/chat-cards.test.mjs`. It checks theme ownership, identical geometry at 260/300/400px, native/custom palettes, controls, disclosures, dynamic sections and nested opposed rows. Review generated screenshots in `docs/`.

The manifest loads effects, shared chat layout, Hub and Minimal files in that order. The fallback deduplicates by URL pathname and preserves Foundry route prefixes. Legacy `header` settings display Hub; legacy `redline` settings display Minimal. Supported saved choices are preserved.

Browser fixtures do not establish live Foundry or every third-party skin's compatibility.

Shift–Alt–C cycles Hub → Minimal → Ultra Compact → OFF → Hub. The registered shortcut uses native priority precedence and consumes both key-down and key-up while the chatCards master setting is enabled. OFF is a skin selection, not a change to that master setting. Enabled palette changes retain card nodes; transitions through OFF recreate only mounted cards with ChatMessage.getHTML, including each mounted popout copy. Foundry v12 ChatLog.render skips already rendered logs and cannot restore these moved card nodes. The composer and drafts are retained, and rapid shortcut presses wait for each card refresh to finish.

Ultra Compact uses the mutually exclusive Minimal palette plus pneuma-skin-compact for density. Its scoped geometry rules live in chat-cards.css; theme files still own appearance only.

Ultra Compact places opposed attack/evasion rows in two right-frame columns. The adapter records their shared row without moving native nodes. Grapple and paired QuickHack wrappers use scoped two-column grids; ordinary single rolls retain their placement. Opposed separators become vertical. Hub and Minimal retain stacked rows.

Ultra Compact D10 dice use explicit dice/total grid cells and static image positioning. Critical pairs retain diagonal positioning with 36px faces offset by 12px. Dice stay left of totals. Opposed label bands reserve equal height so Evasion does not shift its dice row.

Ultra Compact — Pneuma Hub (`compact-hub`) combines pneuma-skin-compact density with the exclusive pneuma-theme-cyberpunk palette. Existing Ultra Compact (`compact`) retains pneuma-theme-technical. Shortcut order is Hub → Minimal → Ultra Compact → Ultra Compact — Pneuma Hub → OFF.
