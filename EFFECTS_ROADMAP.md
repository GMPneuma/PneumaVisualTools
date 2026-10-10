# Token and Full Screen Effects

Two independent settings: **Token Effects** and **Full Screen Effects**. Shared effects use the same underlying triggers and expiry. Humanity stages are full-screen only; tokens must not reveal Humanity.

**Implemented** means local code exists; it does not confirm a published release or complete live Foundry verification. **Planned** records proposed effects still to make. Timers marked TBD need a defined trigger and clearing rule.

| Type | Name | Effect | Expire Timer | Status |
| --- | --- | --- | --- | --- |
| Token | Poison | Dense, soft green clouds over the token; separate patches swell and fade without orbiting. | At the affected character's next turn, or combat end. Outside combat: 6 seconds of game time. | Implemented |
| Full Screen | Poison | Dense green fog pulses irregularly around screen edges; the center remains clear. | At the affected character's next turn, or combat end. Outside combat: 6 seconds of game time. | Implemented |
| Token | Blue Glass | Subdued, soft tie-dye spiral clouds swell and slowly counter-rotate over token artwork, clipped to its transparency mask; seamless color rotation. | When the active primary drug effect expires, is disabled, or is removed. | Implemented; native drug-use trigger needs verification |
| Full Screen | Blue Glass | Two soft tie-dye cloud blooms overlap and swirl around the screen perimeter, with reduced intensity and 9-13 second burst intervals. | When the active primary drug effect expires, is disabled, or is removed. | Implemented; native drug-use trigger needs verification |
| Full Screen | Dissociative — Humanity 20–29 (EMP 2) | Pale peripheral haze and slowly drifting rings. | When Humanity leaves 20–29; switches to the corresponding stage or clears at 30+. | Implemented |
| Full Screen | Psychopathy — Humanity 10–19 (EMP 1) | Cold gray edges with restrained red pulses. | When Humanity leaves 10–19; switches to the corresponding stage or clears at 30+. | Implemented |
| Full Screen | Cyberpsycho — Humanity below 10 (EMP 0) | Stronger crimson edge pulses and fractured peripheral shapes. | When Humanity reaches 10+; switches to the corresponding stage or clears at 30+. | Implemented |
| Token | On Fire — Mild / Strong / Deadly | Procedural flame particles and embers rise and fade over token artwork; particle count and reach follow burning strength. | When the active burning status is removed, disabled, or suppressed. | Implemented |
| Full Screen | On Fire — Mild / Strong / Deadly | Procedural heat-field flames and drifting embers along the bottom edge; intensity follows burning strength. | When the active burning status is removed, disabled, or suppressed. | Implemented; enabled |
| Token | Neural Intrusion / Jack-In | Intermittent cyan/magenta glitch bands over the affected token, clipped to artwork transparency. | When the detected, alerted incoming connection ends. | Implemented; requires updated Combat Tools |
| Full Screen | Neural Intrusion / Jack-In | Localized screen distortion tied to the detected connection. | When the detected connection ends. | Implemented; enabled |
| Token | Radiation Exposure | Yellow-green contamination clouds and sparse particle streaks over the token. | At the affected character's next turn, or combat end. | Implemented; named-effect/API trigger |
| Full Screen | Radiation Exposure | Yellow-green edge grain and intermittent particle streaks. | At the affected character's next turn, or combat end. | Implemented; named-effect/API trigger |
| Token | Electrical Shock | Brief blue-white arcs across the token, clipped to artwork transparency. | At the affected character's next turn, or combat end. | Renderer implemented; gameplay trigger deferred |
| Full Screen | Electrical Shock | Brief blue-white arcs can appear anywhere on screen, with no haze. | At the affected character's next turn, or combat end. | Renderer implemented; gameplay trigger deferred |
| Token | EMP Interference | Procedural white pixel grids and a compact amber warning badge, clipped to token transparency. | When the actual Combat Tools EMP disablement expires or ends with combat. | Implemented; connected to Combat Tools |
| Full Screen | EMP Interference | Varied white pixel grids build and clear square by square. Occasional typed diagnostic messages change position, with at most two visible. | When the actual Combat Tools EMP disablement expires or ends with combat. | Implemented; connected to Combat Tools |
| Token | Flashbang / Dazzled | Bright white flash fading into soft white edge haze, clipped to artwork transparency. | Combat Tools flashbang duration: one minute, or combat end. | Implemented; connected to Combat Tools |
| Full Screen | Flashbang / Dazzled | Bright white flash fading into white haze around screen edges; center clears. | Combat Tools flashbang duration: one minute, or combat end. | Implemented; connected to Combat Tools |
| Token | Gas / Tear Gas Exposure | Gray-green clouds over the token, with an irritated red tint for tear gas. | Combat Tools Tear Gas: one minute or combat end; named gas effect: until cleared. | Implemented; Combat Tools Tear Gas or named-effect trigger |
| Full Screen | Gas / Tear Gas Exposure | Clouded edges, with an irritated red tint for tear gas. | Combat Tools Tear Gas: one minute or combat end; named gas effect: until cleared. | Implemented; Combat Tools Tear Gas or named-effect trigger |
| Token | Black Lace | Faint static black lace mesh at 22% opacity, clipped to token artwork. | When the active primary drug effect expires or is cleared. | Implemented; native primary-effect trigger |
| Full Screen | Black Lace | Cached scalloped lace texture over open mesh, with subtle movement and an inward fade. | When the active primary drug effect expires or is cleared. | Implemented; native primary-effect trigger |
| Token | Boost | Translucent yellow jet flames flowing downward along token edges. | When the active primary drug effect expires or is cleared. | Implemented; native primary-effect trigger |
| Full Screen | Boost | Stylized translucent yellow jets flowing down both screen edges. | When the active primary drug effect expires or is cleared. | Implemented; native primary-effect trigger |
| Token | Smash | Three smaller, softer smileys float upward; no bubbles or confetti. Clipped to token artwork transparency. | When the active primary drug effect expires or is cleared. | Implemented |
| Full Screen | Smash | Smiley emojis and iridescent bubbles rise along the side bands. Occasional confetti bursts fan outward from each band's top center, then fall across roughly 90% of the smiley area through the full height. 36 pieces per side; first burst after 6 seconds, then every 14-21 seconds. | When the active primary drug effect expires or is cleared. | Implemented |
| Token | Synthcoke | Sharp cyan-white streaks and quick intermittent pulses. | When the active primary drug effect expires or is cleared. | Implemented; native primary-effect trigger |
| Full Screen | Synthcoke | Fourteen brighter, broader cyan-white peripheral streaks with glow and faster pulses; center remains clear. | When the active primary drug effect expires or is cleared. | Implemented; native primary-effect trigger |

Poison exposure is saved by Combat Tools on the combat; Visual Tools reads it for both renderers. Refresh recovery requires both updated builds and a newly saved exposure report. Earlier unsaved events cannot be recovered.

Blue Glass addiction alone must not activate the psychedelic visuals. If native drug use does not create or enable a primary effect, that trigger still needs investigation.

Excluded from this list: bleeding, near death, ongoing poison/radiation, cold, and heat.

Remaining transient effects detect enabled effects with the corresponding roadmap names, or can be activated through the Visual Tools `activatePatternEffect(actor, kind)` API. They do not add native conditions or invent new mechanics. Single-round visual reports clear at the affected actor's next turn or combat end; outside combat the API uses six seconds of game time. Electrical Shock remains deliberately unconnected to gameplay.

## Missing Status-List Drugs — Planned

Drug scope comes exclusively from Combat Tools’ `masterStatuses` entries in the `drugs` group: [status-catalog.ts](../PneumaCombatTools/src/scripts/status-catalog.ts). The five original drug effects plus these four cover that list. No additional drugs are inferred from external catalogs. The following renderers read active drug effects/status markers without changing gameplay state; live Foundry activation remains to be verified.

| Type | Name | Effect | Expire Timer | Status |
| --- | --- | --- | --- | --- |
| Token | Berserker | Dark green jagged cuts with a layered red halo, pulsing over masked token artwork. | When the active drug effect/status expires, is disabled, suppressed or removed. | Implemented locally; live activation verification pending |
| Full Screen | Berserker | Dark green aggressive zigzag lines with a soft red glow along the screen edges. | When the active drug effect/status expires, is disabled, suppressed or removed. | Implemented locally; live activation verification pending |
| Token | Prime Time | Rounded triangle outlines with narrow gaps, alternating right and left in a regular mesh over masked token artwork; individual outlines glow cyan and fade back over 4.5 seconds. Soft translucent blue-gray shading and muted amber diamonds at mesh junctions. | When the active drug effect/status expires, is disabled, suppressed or removed. | Implemented locally; live activation verification pending |
| Full Screen | Prime Time | Uniform blue-gray rounded triangle outlines form a regular technical mesh with narrow gaps along both screen edges, alternating right and left down each column. Soft gradient shading and glow soften every triangle; muted amber diamonds fill mesh junctions. Four staggered cyan highlights per side fade back over 4.5 seconds; center remains clear. | When the active drug effect/status expires, is disabled, suppressed or removed. | Implemented locally; live activation verification pending |
| Token | Sixgun | Six cyan/amber data packets move along thin circuit paths over masked token artwork. | When the active drug effect/status expires, is disabled, suppressed or removed. | Implemented locally; live activation verification pending |
| Full Screen | Sixgun | Cyan circuit paths, six sequential packets per motif and restrained amber accents at the edges. | When the active drug effect/status expires, is disabled, suppressed or removed. | Implemented locally; live activation verification pending |
| Token | Timewarp | Layered cyan-violet contours drift with trailing echoes over masked token artwork. | When the active drug effect/status expires, is disabled, suppressed or removed. | Implemented locally; live activation verification pending |
| Full Screen | Timewarp | Long curved cyan-violet streaks with offset afterimages stretch and drift around the perimeter. | When the active drug effect/status expires, is disabled, suppressed or removed. | Implemented locally; live activation verification pending |

## Choking - Implemented locally

Approved additions from the status-list review are limited to the four drugs above and Choking 1 / Choking 2. All other proposals from that review are excluded. Existing implemented effects remain unchanged.

| Type | Name | Effect | Expire Timer | Status |
| --- | --- | --- | --- | --- |
| Token | Choking 1 / Choking 2 | Restrained dark pulses over token artwork, clipped to its transparency mask; stronger at Choking 2. | Follows active Choking status IDs; level 2 takes precedence. Clears on expiry, suppression, disablement or removal. | Implemented locally; live verification pending |
| Full Screen | Choking 1 / Choking 2 | Restrained dark peripheral pulses, stronger at Choking 2; center and controls remain clear. | Follow the active Choking status; verify status transition and removal handling before implementation. | Planned |

Drug previews: **Settings > Visual Tools > Effect Previews > Preview effects** includes all four drugs in screen/token/both modes. A standalone [drug effects preview](docs/drug-effects-preview.html) also uses the built renderers and token artwork mask. Regenerate it after building with `node scripts/drug-effects-preview.mjs`. Reduced motion keeps motifs stationary.
