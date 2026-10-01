# Pneuma's Visual Tools

Planned work and editable statuses: [backlog.md](backlog.md).

Foundry VTT v12 module for Cyberpunk RED.

## Development

Requires Node.js 22 or newer and pnpm 11.19.0.

- Install dependencies: `pnpm install --frozen-lockfile`
- Validate: `pnpm check`
- Build: `pnpm build`

Strict TypeScript and Foundry v12 types follow PneumaCombatTools.
Edit source under `src/`; never edit generated output.

## Structure

- `src/main.ts`: initialization hook.
- `src/chat-cards.css`: shared chat layout and components.
- `src/chat-hub.css` / `src/chat-theme.css`: Hub and Minimal appearance variables.
- `src/pneuma-visualtools.css`: screen effects.
- [Chat theme structure](docs/chat-skins.md): layout contract and maintenance guide.
- `src/en.json`: English localization.
- `scripts/`: build and validation scripts.
- `module.json`: source manifest.
- `dist/`: generated installable files with no subfolders.

## Installation

Build, then copy the contents of `dist/` into `Data/modules/pneuma-visualtools/` in your Foundry data directory. Enable the module in a Cyberpunk RED world running Foundry v12. Package the contents of `dist/` at the ZIP root.

No release has been published. Live Foundry verification is pending.

## Chat cards

In Configure Settings → Pneuma's Visual Tools:

- **Compact chat cards** is the master switch for all chat customization (per client, enabled by default).
- **Chat card skin** selects **Pneuma Hub** (dark cyan/amber, default) or **Cyberpunk Minimal** (native theme colors). Both use the exact same layout, dice sizes, portraits and spacing.
- **Chat portrait image** is a GM-controlled world setting: everyone uses the same token/actor artwork preference for attackers and defenders. Reload to apply. After upgrading from the client setting, the GM should select the world preference once (default: Token image); old per-client choices are no longer used.
- **Fallback chat portrait** is a GM/world image path or URL. Leave it empty for a blank portrait.

The skin changes immediately when saved. Other chat settings marked for reload still require it. Click Self/Whisper/Blind to reveal recipients; hover, focus or click a supported roll total for its saved breakdown. Native damage buttons remain available beside the action details. Combat Tools exchange/AoE layouts and controls are supported. Both skins share layout and behavior; the technical palette inherits system CSS variables for light/dark chat surfaces.

Browser checks: after building, run node scripts/chat-cards.test.mjs with Playwright available and Edge installed. Set PNEUMA_PLAYWRIGHT_MODULE to a module URL if using a separately installed Playwright runtime.

These settings now use the Visual Tools namespace. Reapply any custom portrait preference, fallback image or disabled master switch under Visual Tools after enabling it.

Neural Intrusion screen glitches are configured per player in Visual Tools settings. They require the matching Combat Tools integration for detected Jack-In state; Combat Tools remains usable without this visual module.




Chat style hotkey: **Alt+Shift+C** cycles **1. Pneuma Hub → 2. Cyberpunk Minimal → 1**. Rebind Cycle chat styles in Foundry Configure Controls. Uses the existing client setting and immediately re-skins existing cards without replacing their nodes or expanded details.

### Replaceable weapon artwork
All 21 weapon silhouettes are individual **512 × 256 transparent WebP files**, named `weapon-*.webp`. Source files live directly in `src/`; installed files live directly in the module folder. The same canvas and aspect ratio is used for every weapon, with no per-weapon CSS scaling rules.

The renderer uses a CSS alpha mask: image RGB is ignored, and `--pvt-art-color` supplies one flat theme color. Replace a file with a transparent WebP of the same name and dimensions, then reload. Module updates may overwrite replacements, so keep backups.

Coverage: medium/heavy/very-heavy pistols, SMG/heavy SMG, assault/sniper rifles, shotgun, grenade/rocket launchers, bow, crossbow, four melee weights, unarmed, martial arts, thrown weapon, grenade, and flamethrower. Unknown or concealed weapon titles receive no guessed category.

The original assault-rifle art was retained and resized; the remaining artwork was generated with the built-in image tool. Prompts and source-image provenance are recorded in `docs/weapon-art-generation.json`. A labeled review sheet is in `docs/weapon-art-contact-sheet.html`.


## Chat dice

Chat dice replacement is now built into Visual Tools and works independently of the Compact chat cards switch. Disable the separate **Pneuma Chat Dice** module when using this version.

- **Replace chat dice**: per-client master switch, on by default. Turning it off immediately restores native images.
- **Manage dice sets**: choose Pneuma (default) or a registered custom set. The GM can name a set, choose its folder and file format, validate its images, and add/remove it for the world. Each player selects their preferred set.
- Your existing purple/green standard dice, red/blue critical dice and PREEM D6 are bundled. Missing custom images fall back to these, then to native images if needed.

See [custom set specification](docs/chat-dice-sets.md). A template ZIP is included in the menu. Keep custom images in a world or other shared Foundry data folder outside the Visual Tools module directory so updates do not overwrite them.
