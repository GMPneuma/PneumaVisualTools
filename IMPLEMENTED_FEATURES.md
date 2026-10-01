# Implemented Features

## Chat cards

- Default-on client setting **Compact chat cards** applies during initialization to saved history and new visible messages. The master switch requires reload.
- Two client skins: **Pneuma Hub** (`cyberpunk`, default) and **Cyberpunk Minimal** (`technical`). Alt+Shift+C cycles them. Switching changes mutually exclusive classes without rebuilding cards, rerolling, or changing controls and drafts. Legacy Header selections display Hub; legacy Native selections display Minimal.
- Shared layout: 76px shaded participant rail beside the full right-column header and opening rolls. The rail reaches the bottom of the opening area, stopping only before a later full-width section. Privacy and timestamp/delete tabs sit above the card.
- Participants appear as portrait, name, action, target name and 48px target portrait. GM/world settings choose token or actor artwork and an optional fallback. Missing artwork stays blank; names fit down to 11px, then wrap at spaces with a full-name tooltip.
- Full right-column headers have consistent typography, stepped dividers and weapon masks or action symbols. Compact skill/stat/role headers suppress duplicate labels. Plain chat has no action banner. Native action controls remain usable.
- Single D10s retain square proportions; critical pairs overlap diagonally. D6 groups balance into centered rows with at most five dice per row. Major totals are fixed 46px wells with 32px text; secondary results are 32px wells. Single- and double-digit values use the same geometry.
- Attack and defense share the right-hand frame. Hub has normal dark roll backgrounds, cyan totals and cropped green/red outlines. Minimal has tinted outcome rows, edge stripes and filled totals with white text. Outcomes come only from published semantic classes. No Winner/Loser labels are generated.
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
