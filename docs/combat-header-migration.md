# Combat presentation boundary

Visual Tools owns the skin setting, artwork selection, participant/header presentation and layout annotations. Combat Tools owns rules, outcome state, section markup and workflow controls. The current shared contract is in [chat-skins.md](chat-skins.md).

## Entry points

- `src/exchange-header.ts`: reads saved exchange names/title and decorates the visible header. Accessible matching item categories may choose generic weapon artwork; hidden or generic concealed titles do not disclose a category.
- `src/chat-cards.ts`: establishes portraits/privacy behavior and applies one theme class. Portrait preference and fallback are GM/world settings.
- `src/chat-presentation.ts`: arranges the rail, header and opening/full-width sections; exposes existing saved roll breakdowns. Native workflow wrappers and action nodes retain their ancestry.
- `src/chat-cards.css`: shared geometry and components. The theme files supply appearance variables only.

The rail contains attacker portrait/name, action and defender name/portrait. Metadata sits in tabs above the card. The saved exchange attacker name replaces the duplicated native sender in the rail. Attack and defense share the right frame; published result, damage, effect, target and recovery sections can span the full width.

## Behavior contract

Presentation runs only for visible messages with visible content. It does not alter message flags, roll values, rule outcomes, sockets, targeting or permissions. Names are inserted as text. Hidden target tokens do not expose portraits to non-GMs. Missing artwork stays blank or uses the configured fallback.

The Roll Damage label comes from the native aria-label, and busy/disabled controls keep Combat Tools' behavior. Active-grapple explanations and updates are owned by Combat Tools; Visual Tools only places its existing full-width section. Section annotations refresh after DOM additions/removals without reconstructing controls.

If presentation moves into Combat Tools later, transfer the relevant adapter once, preserve these visibility and event contracts, and remove the competing Visual Tools entry point. This documentation does not authorize that migration.

Headless fixtures cover privacy guards, saved names, hidden/missing artwork, idempotence, event delegation, native controls, dynamic sections, both themes and 260/300/400px widths. Live Foundry verification remains separate. The module targets v12.
