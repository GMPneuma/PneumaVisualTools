# Chat Card Component Reference

Use these as standard reference names for VisualTools chat cards. These describe the current card structure; individual card types use different subsets.

## Card structure

| Name | What it refers to |
|---|---|
| **Card Frame** | Entire card: background, border, corners, and outer spacing. |
| **Metadata Bar** | Timestamp, privacy indicator, and message controls above the content. |
| **Participant Rail** | Left column containing portraits, names, and action indicators. |
| **Action Header** | Heading beside the rail containing the weapon, skill, or action title. |
| **Opening Panel** | Header and initial rolls beside the participant rail. |
| **Card Body** | Content beneath the header. |
| **Resolution Sections** | Later sections spanning the full card width, such as outcome, damage, and effects. |
| **Section Dividers** | Lines separating headers, rolls, and later sections. |

## Metadata and participant parts

| Name | What it refers to |
|---|---|
| **Timestamp** | Message creation time. |
| **Privacy Badge** | Whisper, Self, or Blind indicator. |
| **Recipient List** | Names revealed through the privacy badge. |
| **Message Controls** | Message-level controls, such as delete where available. |
| **Source Portrait** | Image of the actor performing the action. |
| **Source Name** | Name beneath the source portrait. |
| **Rail Action Label** | Base-form action name such as “Attack,” “Skill,” “Grab,” or “Throw” in the rail. |
| **Rail Arrows** | Direction arrows between participants and the action label. |
| **Target Name** | Name of the defending or affected actor. |
| **Target Portrait** | Image of that actor. |

“Attacker Portrait” and “Defender Portrait” are useful aliases on attack cards.

Jack In cards also have a target in the Participant Rail. Authorized viewers, including the GM, see the target supplied by the visible private message. Message privacy and concealed attacker identity remain in effect.

## Header parts

| Name | What it refers to |
|---|---|
| **Action Title** | Weapon, skill, program, or action name. |
| **Action Subtitle** | Supporting action type or category text. |
| **Header Artwork** | Weapon silhouette or action icon. |
| **Header Decoration** | Decorative lines, hatching, and other header graphics. |
| **Difficulty Label** | Displayed DV, where present. |
| **Cost Label** | Resource cost, such as LUCK required for evasion. |

## Rolls and results

| Name | What it refers to |
|---|---|
| **Roll Row** | A complete roll display: label, dice, and total. |
| **Attack Roll Row** | Attacker’s roll display. |
| **Defense Roll Row** | Defender’s roll display. |
| **Damage Roll Row** | Damage dice and total. |
| **Resistance Roll Row** | Roll used to resist an effect. |
| **Roll Label** | Text identifying the roll. |
| **Dice Group** | All dice artwork belonging to one roll. |
| **Die Face** | One individual die image and its displayed value. |
| **Total Box** | Box containing the final roll total. |
| **Outcome Outline** | Success/failure border around a result. |
| **Roll Breakdown Popover** | Details revealed by hovering, focusing, or clicking a total. |
| **Roll Formula** | Dice expression and modifiers within the breakdown. |
| **Outcome Summary** | Sentence such as “Attacker hits Defender.” |
| **Outcome Label** | The specific “hits,” “misses,” or other result wording. |
| **Status Notice** | State text such as “Target cannot evade” or a pending-action message. |
| **Rules Description** | Explanatory mechanics text accompanying a result. |

## Damage, effects, and multiple targets

| Name | What it refers to |
|---|---|
| **Damage Section** | Damage roll, armor controls, application controls, and receipts. |
| **Damage Receipt** | Recorded damage applied to a target. |
| **Applied Damage Total** | Number shown in the damage receipt. |
| **Hit Location Label** | Body/head location text. |
| **Armor Breakdown** | Armor interaction and ablation details. |
| **Effect Section** | Poison, fire, EMP, or another effect’s resolution area. |
| **Effect Entry** | One effect and its individual state, rolls, and controls. |
| **Target List** | Collection of affected targets, particularly on AoE cards. |
| **Target Entry** | One target’s complete row or panel. |
| **Target Response** | That target’s defense choice, roll, or response description. |
| **Recovery Section** | Controls and notices for unfinished or uncertain processing. |

## Button groups

Use these names when requesting button changes:

| Name | Examples |
|---|---|
| **Defense Buttons** | Evade and decline-defense choices. |
| **Roll Damage Button** | Damage-roll control, including the droplet icon. |
| **Damage Application Buttons** | Apply damage to a target. |
| **Armor Buttons** | Interact With Armor; Half Armor SP. |
| **Damage Undo Button** | Reverse previously applied damage. |
| **Effect Resolution Buttons** | Resist, Apply, Unaffected. |
| **Effect Recovery Buttons** | Release Roll; Mark Resolved. |
| **Condition Action Buttons** | Wake; Extinguish. |
| **AoE Area Buttons** | Show/Hide Area; Place New Target Center. |
| **AoE Target Management Buttons** | Add target; exclude target. |
| **AoE Target Response Buttons** | Evade, Cover Up, Don’t Evade, Concentration. |
| **AoE Target Override Buttons** | GM: affected/unaffected. |
| **AoE Target Reset Button** | Reset Player Action. |
| **AoE Movement Button** | Move outside AoE. |
| **AoE Shared Damage Button** | Roll damage shared by affected targets. |
| **Quickhack Buttons** | Force Out; Roll Damage. |
| **EMP Selection Button** | Choose affected items. |
| **Status Cleanup Button** | Clear Token Status Effects. |

## How to refer to a specific part

Use **card type + component + requested change**:

- “The **AoE Target Response Buttons** should be larger.”
- “The **Attack Total Box** should have a thinner outline.”
- “The **Damage Armor Buttons** should use icons.”
- “The **Participant Rail Target Portrait** should be smaller.”
- “The **Effect Resolution Buttons** should match the Defense Buttons.”

For button appearance, specify **button background, border, label, icon, spacing**, or **disabled state**.
