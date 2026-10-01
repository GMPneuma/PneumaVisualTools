# Custom chat dice sets

Open Configure Settings → Pneuma's Visual Tools → Manage dice sets. The GM adds a named set and shared image folder; each player selects a set for their client. Replace chat dice is a separate, default-on master switch. Changes apply immediately to existing chat messages.

## Image specification

Use one folder containing all 31 files below. Names are case-sensitive. Choose one common extension in the menu: `.webp`, `.png`, or `.svg`. The files must be reachable by every player. Square, transparent images are recommended, ideally 256×256 with consistent 16px padding and readable centered faces. SVG files need a square viewBox. The validator checks availability, not artwork quality or padding.

| Filenames (append chosen extension) | Used for |
| --- | --- |
| `d10_1` through `d10_10` | Standard D10 faces |
| `d10_preem`, `d10_fail` | Standard D10 critical-success/failure symbols |
| `critical_d10_1` through `critical_d10_10` | Critical follow-up D10 faces |
| `critical_d10_preem`, `critical_d10_fail` | Critical follow-up success/failure symbols |
| `d6_1` through `d6_6` | Damage D6 faces, including a lone six |
| `d6_6_preem` | Every six in a damage group containing at least two sixes |

The menu's **Download template set** link supplies all 31 correctly named WebP files from the default Pneuma artwork. Unzip it into a shared folder and replace its artwork. There are no per-image settings or nested color directories.

Example: select `worlds/my-world/dice/my-set` and WebP. Visual Tools requests `worlds/my-world/dice/my-set/d10_8.webp` for a standard eight. HTTP(S) image folders can also be entered directly.

**Validate folder** reports missing/unreadable images. A partial set can still be added: missing images use the bundled Pneuma equivalent. If that also fails, the original native image remains available. Applying a selection retries repaired files.

Removing a registered set does not delete files. Clients selecting it automatically use Pneuma until they select another set. The built-in Pneuma set cannot be removed.

## Migration and behavior

Disable the standalone Pneuma Chat Dice module. Its old replacement hook otherwise competes with the master switch and custom set selection. Visual Tools contains a copy of the original artwork; it does not require that module. No standalone module files, releases or saved settings are deleted.

The dice switch is independent of the Compact chat cards skin switch. It changes image paths only and preserves native rolls, result values, controls and dice animation integrations. Keep custom folders outside the module directory to avoid losing artwork during updates.

Source: `src/chat-dice.ts` owns mapping and image fallback; `src/chat-dice-settings.ts` and `.hbs` own the native menu; `src/chat-dice.css` supplies the stock missing D6 size. `scripts/chat-dice.test.mjs` checks this integration. Browser fixtures do not establish live Foundry rendering or every hosting setup.
