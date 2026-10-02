# Chat theme structure

## Layout contract

The opening area has two columns: a 76px shaded participant rail and the remaining right-hand frame. The header spans that right frame, with its graphical divider below. Opening roll rows follow it. The rail spans every opening row, including any remaining space at the bottom.

Later sections reclaim the full card width. The rail ends at their boundary. Neither skin changes this structure, spacing, typography, dice dimensions or total sizes.

| Owner | Responsibility |
| --- | --- |
| `src/chat-cards.css` | Layout, header and rail geometry, dice, result wells, controls, metadata, popovers and composer |
| `src/chat-hub.css` | Hub colors, gradients, clipped-total appearance and decoration |
| `src/chat-theme.css` | Minimal palette mapping from native CPR variables |
| `src/chat-presentation.ts` | Visible-DOM adapters, opening/section annotations, name fitting and saved breakdowns |
| `src/chat-cards.ts` | Settings, visibility guards, portraits and mutually exclusive theme classes |
| `src/chat-styles.ts` | Missing stylesheet fallback for cached manifests |
| `src/pneuma-visualtools.css` | Neural Intrusion screen effects only |

## Section placement

`arrangeCardSections` is the single boundary adapter. It marks existing native wrappers with `pvt-section-flow` (`display: contents`), and opening rows with `pvt-opening-row` and a row number. The rail spans row 1 through `--pvt-opening-end`. Unclassified children of a flow wrapper are full-width rows by default.

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
