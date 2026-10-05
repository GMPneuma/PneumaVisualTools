import { weaponSilhouette } from "./weapon-silhouettes.js";
import {replaceChatDice} from './chat-dice.js';
/** MIGRATION: visible-DOM presentation adapter only. Move with Combat Tools
 * rendering if needed; never changes rolls, flags, permissions or actions. */
export function arrangeChatCard(root: HTMLElement, message?: ChatMessage): void {
  if (root.classList.contains('pneuma-layout-participants')) return;
  const meta = root.querySelector('.message-metadata');
  if (meta) {
    const bar = document.createElement('div'); bar.className = 'pneuma-card-meta';
    const badge = meta.querySelector('.chat-mode-indicator'); if (badge) bar.append(badge);
    bar.append(meta); root.prepend(bar);
    const recipients = root.querySelector('.pneuma-chat-recipients'); if (recipients) bar.append(recipients);
  }
  const portrait = root.querySelector('.pneuma-chat-portrait');
  const identity = root.querySelector('.pneuma-chat-identity');
  if (portrait && identity) {
    const rail = document.createElement('div'); rail.className = 'pneuma-participant-rail';
    root.append(rail); rail.append(portrait, identity);
    const exchange = root.querySelector('.pneuma-exchange-header');
    if (exchange) {
      const attacker = exchange.querySelector('.pneuma-exchange-attacker');
      if (attacker) { identity.querySelector('.message-sender')?.remove(); identity.prepend(attacker); }
      const action = document.createElement('span'); action.className = 'pneuma-rail-action';
      action.textContent = 'Attack ↓'; rail.append(action);
      const image = exchange.querySelector('.pneuma-exchange-defender-image');
      const name = exchange.querySelector('.pneuma-exchange-defender');
      if (image) rail.append(image); if (name) rail.append(name);
      exchange.querySelectorAll('.pneuma-exchange-arrow').forEach(el => el.remove());
    }
  }
  // Use visible headings only; generic concealed attacks get no inferred art.
  for (const heading of Array.from(root.querySelectorAll<HTMLElement>('.pneuma-chat-action'))) {
    const attackKind = heading.querySelector('.rollcard-subtitle-center')?.textContent ?? '';
    if (!heading.querySelector('[data-action="rollDamage"]') && !root.querySelector('.pneuma-aoe-card') && !/\b(attack|throw|autofire|suppressive fire)\b/i.test(attackKind)) continue;
    const title = heading.querySelector<HTMLElement>('.pneuma-attack-name, .text-normal, h3');
    let type: string | undefined;
    // Native custom weapon names still use their category, but only when the
    // already-rendered control identifies an accessible matching item.
    const control = heading.querySelector<HTMLElement>('[data-action="rollDamage"]');
    if (control) {
      try {
        const token = control.dataset.tokenId ? canvas.scene?.tokens.get(control.dataset.tokenId) : undefined;
        const actor = token?.actor ?? (control.dataset.actorId ? game.actors?.get(control.dataset.actorId) : undefined);
        const item = control.dataset.itemId ? actor?.items.get(control.dataset.itemId) : undefined;
        if ((!token?.hidden || game.user!.isGM) && actor?.testUserPermission(game.user!, 'LIMITED') && item?.name === title?.textContent?.trim()) type = (item!.system as {weaponType?: string}).weaponType;
      } catch { /* Detached history or unavailable canvas: visible-name fallback. */ }
    }
    const src = title && weaponSilhouette(title.textContent ?? '', type);
    if (title && src) {
      heading.classList.add('pneuma-silhouette-header'); title.classList.add('pneuma-exchange-weapon');
      const art = document.createElement('span'); art.className = 'pneuma-exchange-weapon-image';
      art.setAttribute('aria-hidden', 'true'); art.style.maskImage = `url("${src}")`; title.prepend(art);
    }
  }
  arrangeRailAction(root, message);
  const rail = root.querySelector('.pneuma-participant-rail');
  const action = rail?.querySelector('.pneuma-rail-action');
  if (action) {
    const arrow = () => { const node = document.createElement('span'); node.className = 'pneuma-rail-arrow'; node.textContent = '↓'; node.setAttribute('aria-hidden', 'true'); return node; };
    action.before(arrow());
    if (rail?.querySelector('.pneuma-exchange-defender')) action.after(arrow());
  }
  const target = rail?.querySelector('.pneuma-exchange-defender');
  const targetImage = rail?.querySelector('.pneuma-exchange-defender-image');
  if (target && targetImage) target.after(targetImage);
  root.classList.add('pneuma-layout-participants');
  arrangeCardHeader(root);
  arrangeCardSections(root);
  // Presentation-only name fitting: readable 11px floor, then word wrapping.
  const fitNames = () => {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return;
    for (const name of Array.from(root.querySelectorAll<HTMLElement>('.pneuma-participant-rail :is(.message-sender, .pneuma-exchange-attacker, .pneuma-exchange-defender)'))) {
      const text = name.textContent?.trim() ?? '';
      name.title = text; name.classList.add('pneuma-rail-name');
      const style = getComputedStyle(name);
      const width = root.querySelector('.pneuma-participant-rail')?.clientWidth || 54;
      let size = 13;
      const measure = () => { context.font = `${style.fontWeight || '700'} ${size}px ${style.fontFamily || 'sans-serif'}`; return context.measureText(text).width; };
      while (size > 11 && measure() > width - 10) size--;
      name.style.fontSize = `${size}px`;
      name.classList.toggle('pneuma-rail-name-wrap', /\s/.test(text) && measure() > width - 10);
    }
  };
  fitNames();
  void document.fonts.ready.then(fitNames);
}


/** Layout contract: an opening rail/title/roll area followed by full-width rows.
 * Native wrappers stay in place so delegated actions and module updates retain
 * their original ancestry. Only the marked flow wrappers use display:contents.
 * New children of a flow wrapper default to full width (e.g. late recovery).
 */
export function arrangeCardSections(root: HTMLElement): void {
  if (!root.classList.contains('pneuma-unified-header')) return;
  const content = root.querySelector<HTMLElement>(':scope > .message-content');
  if (!content) return;
  const plain = root.classList.contains('pneuma-plain-chat');
  let row = plain ? 1 : 2;
  const opening = (element: HTMLElement) => {
    element.classList.add('pvt-opening-row');
    element.style.setProperty('--pvt-row', String(row++));
  };
  // Re-evaluate after published markup additions; no nodes are reconstructed.
  root.querySelectorAll<HTMLElement>('.pvt-opening-row').forEach(node => {
    node.classList.remove('pvt-opening-row'); node.style.removeProperty('--pvt-row');
  });
  root.querySelectorAll('.pvt-section-flow, .pvt-full-section, .pvt-opening-stack, .pvt-opposed-divider')
    .forEach(node => node.classList.remove('pvt-section-flow', 'pvt-full-section', 'pvt-opening-stack', 'pvt-opposed-divider'));
  const sections = content.querySelector<HTMLElement>(':scope > .pneuma-resolution-card, :scope > .pneuma-aoe-card');
  const grapple = content.querySelector<HTMLElement>(':scope > .pneuma-grapple-card');
  if (sections) {
    content.classList.add('pvt-section-flow'); sections.classList.add('pvt-section-flow');
    for (const child of Array.from(sections.children)) {
      if (child instanceof HTMLElement && child.matches('.pneuma-resolution-attack, .pneuma-attack-result, .pneuma-resolution-pending, .pneuma-resolution-evade')) opening(child);
    }
  } else if (grapple) {
    content.classList.add('pvt-section-flow'); opening(grapple);
  } else if (root.classList.contains('pneuma-adhoc-damage')) {
    content.classList.add('pvt-full-section');
  } else {
    opening(content);
  }
  root.style.setProperty('--pvt-opening-end', String(row));
  root.querySelectorAll('.pvt-opening-row').forEach(node => {
    if (node.querySelector('.pneuma-grapple-rolls, .pneuma-quickhack-roll')) node.classList.add('pvt-opening-stack');
  });
  // An explicit marker replaces outcome-dependent selectors in theme styles.
  root.querySelectorAll<HTMLElement>('.pneuma-resolution-evade, .pneuma-grapple-rolls > div + div, .pneuma-quickhack-roll + .pneuma-quickhack-roll')
    .forEach(node => node.classList.add('pvt-opposed-divider'));
}

/** Decorated title over the primary roll; the rail owns participant order. */
function arrangeCardHeader(root: HTMLElement): void {
  const rail = root.querySelector<HTMLElement>('.pneuma-participant-rail');
  if (!rail) return;
  const header = document.createElement('div'); header.className = 'pneuma-card-heading';
  let title = root.querySelector<HTMLElement>('.pneuma-exchange-header, .pneuma-chat-action:not(.pneuma-relocated-heading)');
  const net = root.querySelector('.pneuma-quickhack-card');
  const grapple = root.querySelector('.pneuma-grapple-card');
  const adHocDamage = root.querySelector<HTMLElement>('.pneuma-manual-card[data-manual-kind="damage"]');
  const recovery = !!root.querySelector('.pneuma-ma-recovery-result');
  const ammo = root.querySelector<HTMLElement>('.pneuma-ammo-notice');
  const noticeAction = ammo?.dataset.ammoAction === 'reload' ? 'Reload' : ammo?.dataset.ammoAction === 'change' ? 'Change Ammo'
    : root.querySelector('.pneuma-self-action-report') ? 'Get Up' : '';
  const plain = !noticeAction && !title && !net && !grapple && !root.querySelector('.rollcard, .dice-roll, .pneuma-custom-roll-card, .pneuma-instant-card, .pneuma-injury-card, .pneuma-emp-card, .pneuma-status-cleanup-card');
  if (!title) {
    title = document.createElement('div'); title.className = 'pneuma-card-title';
    const text = document.createElement('h3');
    text.textContent = adHocDamage ? 'Damage Roll' : noticeAction ? 'Taking Action' : net ? root.querySelector('.pneuma-quickhack-heading h3')?.textContent?.trim() || 'Netrunning'
      : grapple ? rail.querySelector('.pneuma-rail-action')?.textContent?.trim() || 'Grapple'
      : root.querySelector('.dice-roll, .rollcard') ? 'Roll' : 'Chat';
    title.append(text);
  }
  const nativeKind = Array.from(title.querySelectorAll<HTMLElement>('.text-small, .rollcard-subtitle > *, span, div'))
    .find(node => !node.children.length && /^(skill|stat|role ability|initiative)$/i.test(node.textContent?.trim() ?? ''));
  const subtitle = nativeKind?.textContent?.trim() || title.querySelector('.rollcard-subtitle-center')?.textContent?.trim() || '';
  const skill = !net && !grapple && !root.querySelector('.pneuma-exchange-header, .pneuma-aoe-card')
    && !title.querySelector('[data-action="rollDamage"]') && (recovery || /skill/i.test(subtitle));
  const independent = !net && !grapple && !root.querySelector('.pneuma-exchange-header, .pneuma-aoe-card') && !title.querySelector('[data-action="rollDamage"]');
  const kindText = subtitle || title.textContent || '';
  const stat = independent && /\bstat\b/i.test(kindText);
  const role = independent && /role\s*ability|roleAbility/i.test(kindText);
  const initiative = independent && /initiative/i.test(kindText);
  const critical = independent && (!!root.querySelector('.pneuma-manual-card[data-manual-kind="critical"]') || /critical\s+injur/i.test(title.textContent ?? ''));
  // D6 is also used by injury tables; dice shape is not an action type.
  const damage = !!adHocDamage || independent && !critical && !skill && !stat && !role && !initiative && /\bdamage\b/i.test(kindText);
  const generic = independent && !noticeAction && !critical && !skill && !stat && !role && !initiative && !damage && !plain;
  root.classList.toggle('pneuma-plain-chat', plain);
  if (skill || stat || role) header.classList.add('pneuma-heading-check');
  if (nativeKind && (skill || stat || role || initiative)) nativeKind.classList.add('pneuma-relocated-heading');
  if (initiative) header.classList.add('pneuma-heading-initiative');
  header.classList.add(net ? 'pneuma-heading-net' : skill ? 'pneuma-heading-skill' : title.classList.contains('pneuma-card-title') ? 'pneuma-heading-plain' : 'pneuma-heading-attack');
  if (skill) {
    const action = rail.querySelector('.pneuma-rail-action');
    if (action) action.textContent = 'Skill';
  }
  let action = rail.querySelector<HTMLElement>('.pneuma-rail-action');
  if (!action) {
    action = document.createElement('span'); action.className = 'pneuma-rail-action';
    action.textContent = skill ? 'Skill' : net ? 'Netrunning' : root.querySelector('.dice-roll, .rollcard') ? 'Roll' : 'Chat';
  }
  if (skill || stat || role || initiative || damage) action.textContent = skill ? 'Skill' : stat ? 'Stat' : role ? 'Role Ability' : initiative ? 'Initiative' : 'Suppression';
  if (noticeAction) action.textContent = noticeAction;
  if (critical) action.textContent = 'Critical Injury';
  if (adHocDamage) {
    action.textContent = 'Damage';
    root.classList.add('pneuma-adhoc-damage');
    const originalTitle = adHocDamage.querySelector<HTMLElement>(':scope > h3');
    if (originalTitle) { title.title = originalTitle.textContent?.trim() ?? ''; originalTitle.classList.add('pneuma-relocated-heading'); }
  }
  rail.querySelectorAll('.pneuma-rail-arrow').forEach(node => node.remove());
  const arrow = () => {
    const node = document.createElement('span'); node.className = 'pneuma-rail-arrow';
    node.textContent = '↓'; node.setAttribute('aria-hidden', 'true'); return node;
  };
  const portrait = rail.querySelector('.pneuma-chat-portrait');
  const identity = rail.querySelector('.pneuma-chat-identity');
  const target = rail.querySelector('.pneuma-exchange-defender');
  const targetPortrait = rail.querySelector('.pneuma-exchange-defender-image');
  if (portrait) rail.append(portrait);
  if (identity) rail.append(identity);
  if (!plain && !generic) rail.append(arrow(), action);
  else action.remove();
  if (target) { rail.append(arrow(), target); if (targetPortrait) rail.append(targetPortrait); }

  if (critical) arrangeCriticalResult(root, title);
  title.classList.add('pneuma-action-header', 'pneuma-silhouette-header');
  const label = title.querySelector<HTMLElement>('.pneuma-exchange-weapon, .pneuma-attack-name, .text-normal, h3');
  if (label) {
    if (recovery) {
      const dv = label.textContent?.match(/\bDV\s*\d+/i)?.[0];
      label.textContent = 'Martial Arts Recovery';
      if (dv) { const detail = document.createElement('div'); detail.className = 'pneuma-check-dv'; detail.textContent = dv; label.after(detail); }
    }
    if (generic && label.textContent?.trim() === 'Roll') label.textContent = '';
    label.classList.add('pneuma-exchange-weapon');
    if (!label.querySelector('.pneuma-exchange-weapon-image')) {
      const symbol = document.createElement('i');
      symbol.className = `fas ${net ? 'fa-microchip' : initiative ? 'fa-crosshairs' : grapple ? 'fa-hand-rock' : skill || stat || role ? 'fa-bullseye' : root.querySelector('.dice-roll, .rollcard') ? 'fa-dice-d20' : 'fa-comment-alt'} pneuma-header-symbol`;
      symbol.setAttribute('aria-hidden', 'true'); label.append(symbol);
    }
  }
  root.querySelector('.message-content')?.before(header);
  header.append(rail);
  if (!plain) header.append(title);
  root.classList.add('pneuma-unified-header');
}

/** Keep native injury links/controls, but separate table title from its result. */
function arrangeCriticalResult(root: HTMLElement, title: HTMLElement): void {
  const body = root.querySelector<HTMLElement>('.message-content');
  if (!body) return;
  const nativeHeader = root.querySelector<HTMLElement>('.pneuma-manual-card[data-manual-kind="critical"] .rollcard-top') ?? title;
  const category = (nativeHeader.textContent ?? '').match(/critical\s+injur(?:y|ies)\s*\(?(body|head)\)?/i)
    ?? (body.textContent ?? '').match(/critical\s+injur(?:y|ies)\s*\(?(body|head)\)?/i);
  const heading = document.createElement('h3');
  heading.textContent = category ? `Critical Injury (${category[1]!.toLowerCase() === 'head' ? 'Head' : 'Body'})` : 'Critical Injury';
  const result = document.createElement('section'); result.className = 'pneuma-critical-result';
  // A repeated plain injury name is already present in the native result body.
  const bodyCopy = body.cloneNode(true) as HTMLElement;
  bodyCopy.querySelectorAll('.rollcard-top').forEach(node => node.remove());
  const existing = bodyCopy.textContent ?? '';
  for (const leaf of Array.from(nativeHeader.querySelectorAll<HTMLElement>('*'))) {
    if (leaf.children.length || leaf.matches('a, button, img, input, i') || leaf.closest('a, button')) continue;
    const text = leaf.textContent?.trim() ?? '';
    if (/^critical\s+injur(?:y|ies)(?:\s*\((?:body|head)\))?$/i.test(text) || (text && existing.includes(text))) leaf.remove();
  }
  while (nativeHeader.firstChild) result.append(nativeHeader.firstChild);
  title.replaceChildren(heading);
  if (nativeHeader !== title) nativeHeader.remove();
  const roll = body.querySelector('.d6-rollcard-data, .generic-rollcard-data, .dice-roll');
  if (result.textContent?.trim() || result.querySelector('a, button, img')) {
    if (roll) roll.after(result); else body.append(result);
  }
}

/** Visual Tools-only adapters for published Combat Tools markup. Names come
 * from rendered headings, never concealed actor documents. Preserve controls
 * and outcome/rules text; only the action/participant heading is relocated. */
function arrangeRailAction(root: HTMLElement, message?: ChatMessage): void {
  const rail = root.querySelector('.pneuma-participant-rail');
  const identity = rail?.querySelector('.pneuma-chat-identity');
  if (!rail || !identity) return;
  const setName = (text: string) => {
    let name = identity.querySelector<HTMLElement>('.message-sender, .pneuma-exchange-attacker');
    if (!name) { name = document.createElement('span'); name.className = 'pneuma-exchange-attacker'; identity.append(name); }
    name.textContent = text;
  };
  const setAction = (text: string) => {
    let action = rail.querySelector<HTMLElement>('.pneuma-rail-action');
    if (!action) { action = document.createElement('span'); action.className = 'pneuma-rail-action'; identity.after(action); }
    action.textContent = text;
  };
  const setTarget = (text: string) => {
    let target = rail.querySelector<HTMLElement>('.pneuma-exchange-defender');
    if (!target) { target = document.createElement('span'); target.className = 'pneuma-exchange-defender'; rail.append(target); }
    target.textContent = text;
  };
  const grappleHeading = root.querySelector<HTMLElement>('.pneuma-grapple-card > .rollcard > .rollcard-top');
  const grapple = grappleHeading?.textContent?.trim().match(/^(Grab|Break Grapple|Release|Choke|Throw):\s*(.+?)\s*→\s*(.+)$/);
  if (grapple) {
    setName(grapple[2]!);
    setAction(grapple[1]!);
    setTarget(grapple[3]!); grappleHeading!.classList.add('pneuma-relocated-heading');
    return;
  }
  const participants = root.querySelector<HTMLElement>('.pneuma-quickhack-participants');
  if (participants) {
    const names = participants.textContent?.trim().match(/^(.+?)\s*→\s*(.+)$/);
    const heading = root.querySelector<HTMLElement>('.pneuma-quickhack-heading h3');
    if (names && heading) {
      setName(names[1]!); setTarget(names[2]!); setAction(heading.textContent?.trim() ?? '');
      participants.classList.add('pneuma-relocated-heading'); heading.classList.add('pneuma-relocated-heading');
      // The moved outer heading can be empty; its divider is no longer needed.
      root.querySelector('.pneuma-chat-action')?.classList.add('pneuma-relocated-heading');
      return;
    }
  }
  const flags = (message?.flags as Record<string, {aoe?: {kind?: string; exchange?: {thrownSource?: unknown}}}> | undefined)?.['pneuma-combattools'];
  const aoe = flags?.aoe;
  const heading = root.querySelector<HTMLElement>('.pneuma-chat-action');
  if (root.querySelector('.pneuma-aoe-card')) {
    const title = heading?.textContent?.trim() ?? '';
    if (aoe?.exchange?.thrownSource && /grenade/i.test(title)) {
      setAction('Throw'); setTarget('Grenade');
      const name = heading?.querySelector<HTMLElement>('.pneuma-attack-name');
      if (name) {
        const detail = name.textContent?.replace(/\bgrenade\b/i, '').replace(/^\s*[—–:·-]\s*|\s*[—–:·-]\s*$/g, '').trim() ?? '';
        const art = name.querySelector('.pneuma-exchange-weapon-image');
        name.textContent = detail || 'Grenade';
        if (art) name.prepend(art);
      }
    } else if (aoe?.kind === 'suppression') setAction('Suppress');
    else setAction('Attack');
  } else if (root.querySelector('.pneuma-exchange-header')) {
    setAction('Attack');
  } else {
    const subtitle = heading?.querySelector<HTMLElement>('.rollcard-subtitle-center');
    if (subtitle && !subtitle.querySelector('a, button') && subtitle.textContent?.trim()) {
      setAction(subtitle.textContent.trim()); subtitle.classList.add('pneuma-relocated-heading');
    }
  }
  // Initial attack labels duplicate the rail verb. Keep weapon/ammunition,
  // defensive skill labels, pending-state messages and all outcome text.
  root.querySelectorAll<HTMLElement>('.pneuma-attack-result .rollcard-subtitle-center, .pneuma-resolution-attack .rollcard-subtitle-center, .pneuma-resolution-attack-label').forEach(label => {
    if (label.textContent?.trim() === 'Attack' && !label.querySelector('a, button')) label.classList.add('pneuma-relocated-heading');
  });
}
let popup: HTMLElement | undefined;
let owner: HTMLElement | undefined;
let listening = false;
let damageDiceObserver: ResizeObserver | undefined;
const observedCards = new WeakSet<HTMLElement>();
/** Balance rows rather than letting flex-wrap leave a single die on its own.
 * Use available width; smaller areas retain balanced rows. */
function balanceDamageDice(group: HTMLElement): void {
  const dice = Array.from(group.children).filter((node): node is HTMLImageElement => node instanceof HTMLImageElement);
  const width = group.clientWidth;
  if (!dice.length || !width) return;
  const capacity = Math.max(1, Math.floor((width + 2) / 46));
  const rows = Math.ceil(dice.length / capacity);
  const perRow = Math.floor(dice.length / rows), extra = dice.length % rows;
  const columns = perRow + (extra ? 1 : 0);
  const size = Math.min(48, (width - (columns - 1) * 4) / columns);
  group.style.setProperty('--pvt-damage-size', `${size}px`);
  group.style.gridTemplateColumns = `repeat(${columns * 2}, ${size / 2}px)`;
  // Half-width tracks allow odd short rows to be centered exactly.
  group.style.columnGap = '0px';
  let index = 0;
  for (let row = 0; row < rows; row++) {
    const count = perRow + (row < extra ? 1 : 0);
    for (let col = 0; col < count; col++) {
      const die = dice[index++]!;
      die.style.gridRow = String(row + 1);
      die.style.gridColumn = `${columns - count + 1 + col * 2} / span 2`;
    }
  }
}
function closePopup(): void { popup?.remove(); popup = undefined; owner?.removeAttribute('aria-describedby'); owner = undefined; }
/** Works while Foundry's render hook still owns a detached message element. */
function isShown(element: Element): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (node.hasAttribute('hidden') || node.classList.contains('hide') || node.classList.contains('pneuma-popover-source')
      || getComputedStyle(node).display === 'none' || getComputedStyle(node).visibility === 'hidden') return false;
    if (node instanceof HTMLDetailsElement && !node.open && !node.querySelector('summary')?.contains(element)) return false;
  }
  return true;
}
/** Replace generic D6 tooltip tiles using only their saved, rendered faces. */
function normalDamageDice(copy: HTMLElement): void {
  for (const list of Array.from(copy.querySelectorAll<HTMLElement>('.dice-rolls'))) {
    const faces = Array.from(list.children);
    if (!faces.length || faces.some(die => !die.matches('.die.d6') || !/^[1-6]$/.test(die.textContent?.trim() ?? ''))) continue;
    list.closest('.tooltip-part')?.classList.add('pneuma-dice-art-part');
    const group = document.createElement('div'); group.className = 'd6-dice-div';
    for (const die of faces) {
      const face = die.textContent!.trim();
      const native = `systems/cyberpunk-red-core/icons/dice/black/d6_${face}.svg`;
      const image = document.createElement('img'); image.alt = `D6: ${face}`;
      image.src = native;
      image.addEventListener('error', () => { image.src = native; }, { once: true });
      if (die.classList.contains('discarded')) image.style.opacity = '.4';
      group.append(image);
    }
    list.replaceWith(group);
    replaceChatDice(group);
  }
}

/** Compact only already-rendered results; never reconstruct hidden roll data. */
function arrangeMiniResults(root: HTMLElement): void {
  // Published receipt notes follow their native card. Keep each note with its
  // recipient while preserving the actual receipt and actionable descendants.
  for (const receipt of Array.from(root.querySelectorAll<HTMLElement>('.pneuma-damage-applied'))) {
    while (receipt.nextElementSibling?.matches('.pneuma-cover-up-damage, .pneuma-injury-damage')) {
      receipt.append(receipt.nextElementSibling);
    }
    const undo=receipt.querySelector<HTMLElement>('[data-action="reverseDamage"]');
    if(undo){
      undo.title ||= 'Reverse damage';undo.classList.add('pneuma-damage-undo');
      const row=receipt.querySelector('.pneuma-damage-applied-row');
      if(row&&undo.parentElement!==row)row.append(undo);
    }
  }
  const row = (label: HTMLElement, result: HTMLElement, color?: string) => {
    const wrapper = document.createElement('div'); wrapper.className = 'pneuma-mini-result-row';
    result.before(wrapper); wrapper.append(label, result);
    if (color) result.style.setProperty('--pvt-mini-color', color);
    return wrapper;
  };
  for (const effect of Array.from(root.querySelectorAll<HTMLElement>('.pneuma-instant-effect'))) {
    if (effect.dataset.pvtMini || effect.classList.contains('pneuma-aoe-inline-effect')) continue;
    effect.dataset.pvtMini = 'true';
    const heading = effect.querySelector<HTMLElement>(':scope > strong');
    const rolls = Array.from(effect.querySelectorAll<HTMLElement>(':scope > .pneuma-inline-roll, :scope > strong + strong, :scope > .pneuma-instant-damage > .pneuma-inline-roll'));
    for (const roll of rolls) {
      const summary = roll.querySelector('summary');
      const isDamage = summary?.getAttribute('aria-label')?.startsWith('Damage roll');
      if (isDamage) {
        const label = roll.previousElementSibling;
        if (!(label instanceof HTMLElement) || label.textContent?.trim() !== 'Damage') continue;
        // The applied receipt belongs with damage, including armor interaction.
        const receipt = effect.querySelector<HTMLElement>(':scope > span');
        if (effect.dataset.state === 'applied' && receipt && receipt !== label) {
          roll.querySelector('.pneuma-inline-roll-details')?.prepend(receipt);
        }
        row(label, roll);
      } else if (heading) {
        if (!summary) roll.classList.add('pneuma-mini-value');
        heading.textContent = `Resist ${heading.textContent?.trim() ?? ''}`;
        const state = effect.dataset.state;
        row(heading, roll, state === 'resisted' ? 'var(--pvt-success, #20ee79)' : ['failed', 'applied', 'applying', 'review'].includes(state ?? '') ? 'var(--pvt-failure, #ff354d)' : undefined);
      }
    }
  }
  for (const response of Array.from(root.querySelectorAll<HTMLElement>('.pneuma-aoe-response'))) {
    const roll = response.querySelector<HTMLElement>(':scope > .pneuma-inline-roll, :scope > strong');
    if (!roll) continue;
    if (roll.tagName === 'STRONG') roll.classList.add('pneuma-mini-value');
    const label = document.createElement('span');
    label.textContent = roll.querySelector('summary')?.getAttribute('aria-label')?.split(' — ')[0] || 'Defense';
    const state = response.closest<HTMLElement>('.pneuma-aoe-target')?.dataset.state;
    const wrapper = row(label, roll, state === 'miss' ? 'var(--pvt-success, #20ee79)' : state === 'hit' ? 'var(--pvt-failure, #ff354d)' : undefined);
    response.after(wrapper);
  }
  for (const applied of Array.from(root.querySelectorAll<HTMLElement>('.pneuma-damage-applied-row'))) {
    if (applied.dataset.pvtMini || applied.closest('.pneuma-aoe-resolution-target')) continue;
    applied.dataset.pvtMini = 'true';
    const total = applied.querySelector<HTMLElement>('.pneuma-applied-number');
    if (!total) continue;
    const label = document.createElement('span');
    const parts='.pneuma-applied-name, .pneuma-applied-location';
    for (const part of Array.from(applied.querySelectorAll(parts))) {
      if (label.childNodes.length) label.append(' · ');
      label.append(part);
    }
    if (!label.childNodes.length) label.textContent = 'Damage';
    applied.prepend(label); applied.classList.add('pneuma-mini-result-row');
  }
}

export function installRollPopovers(root: HTMLElement): void {
  // Saved cards may have the former target-controls disclosure. Keep live
  // controls and their handlers while restoring direct GM actions.
  for (const menu of Array.from(root.querySelectorAll('.pvt-target-controls'))) {
    menu.replaceWith(...Array.from(menu.querySelectorAll('button')));
  }
  arrangeCardSections(root);
  arrangeMiniResults(root);
  // MIGRATION: Combat Tools appends effects/application results after render.
  // Observe child-list changes only; never modify message documents or combat state.
  if (!observedCards.has(root)) {
    observedCards.add(root);
    new MutationObserver(records => {
      if (records.some(record => [record.addedNodes, record.removedNodes].some(nodes => Array.from(nodes).some(node => node instanceof Element)))) installRollPopovers(root);
    }).observe(root, {childList: true, subtree: true});
  }
  damageDiceObserver ??= new ResizeObserver(entries => {
    for (const entry of entries) {
      if (!entry.target.isConnected) { damageDiceObserver!.unobserve(entry.target); continue; }
      balanceDamageDice(entry.target as HTMLElement);
    }
  });
  root.querySelectorAll<HTMLElement>('.d6-dice-div').forEach(group => {
    group.classList.add('pneuma-balanced-dice'); balanceDamageDice(group); damageDiceObserver!.observe(group);
  });
  if (!listening) {
    listening = true;
    window.addEventListener('scroll', closePopup, {capture: true, passive: true});
    window.addEventListener('resize', closePopup);
  }
  // Native enriched inline results store the evaluated roll in their DOM.
  // Rendering its tooltip does not roll again or consult private message flags.
  for (const link of Array.from(root.querySelectorAll<HTMLElement>('.inline-roll.inline-result[data-roll]'))) {
    if (link.dataset.pvtPreparing) continue;
    link.dataset.pvtPreparing = 'true';
    try {
      const roll = Roll.fromJSON(decodeURIComponent(link.dataset.roll!));
      void roll.getTooltip().then(html => {
        if (!root.isConnected) return;
        const source = document.createElement('div'); source.className = 'pneuma-popover-source';
        const formula = document.createElement('div'); formula.textContent = roll.formula; source.append(formula);
        const rendered = document.createElement('div'); rendered.innerHTML = html; source.append(rendered);
        link.after(source); link.dataset.pvtInlineSource = 'true'; installRollPopovers(root);
      }).catch(() => { /* Keep native behavior if the saved roll cannot render. */ });
    } catch { /* Malformed or unsupported saved rolls remain native. */ }
  }
  for (const trigger of Array.from(root.querySelectorAll<HTMLElement>('.d10-number-div, .d6-number-div, .generic-number-div, .dice-total, .pneuma-applied-number, .pneuma-inline-roll > summary, [data-pvt-inline-source]'))) {
    // Resolution receipts and effect rolls expand beneath their own rows.
    if (trigger.matches('.pneuma-applied-number') || trigger.closest('.pneuma-aoe-inline-effect')) continue;
    const inline = trigger.closest('.pneuma-inline-roll');
    // The summary owns the entire compact roll; ignore its concealed totals.
    if (inline && trigger.tagName !== 'SUMMARY') continue;
    const scope = inline ?? trigger.closest('.d10-rollcard-data, .d6-rollcard-data, .generic-rollcard-data, .dice-roll, .pneuma-damage-applied, .cpr-block');
    const disclosure = trigger.matches('[data-visible-element]') ? trigger : trigger.querySelector<HTMLElement>('[data-visible-element]');
    const detailClass = disclosure?.dataset.visibleElement;
    // Follow the actual disclosure contract, including uniquely scoped defense
    // and applied-damage classes, without interpolating untrusted CSS selectors.
    const linkedDetails = detailClass ? Array.from(scope?.querySelectorAll<HTMLElement>('[class]') ?? []).find(el => el.classList.contains(detailClass)) : undefined;
    const details = trigger.dataset.pvtInlineSource ? trigger.nextElementSibling as HTMLElement : inline?.querySelector<HTMLElement>('.pneuma-inline-roll-details')
      ?? linkedDetails ?? scope?.querySelector<HTMLElement>('.d10-data-details, .d6-data-details, .generic-data-details, .pneuma-applied-details, .dice-tooltip');
    if (!details || trigger.dataset.pvtPopover) continue;
    // Keep native undo actionable outside the now-hover-only breakdown.
    const undo = details.querySelector<HTMLElement>('[data-action="reverseDamage"]');
    if (undo) {
      undo.title ||= 'Reverse damage'; undo.classList.add('pneuma-damage-undo');
      if (trigger.classList.contains('pneuma-applied-number')) trigger.parentElement?.append(undo);
      else scope?.append(undo);
    }
    const dice = scope?.querySelector<HTMLElement>('.d10-dice-div, .d6-dice-div, .generic-dice-div');
    const diceShown = !!dice && isShown(dice);
    const detailsShown = isShown(details);
    // Damage/base rolls often have an empty modifier disclosure. Preserve
    // visible critical/autofire rows and never create a redundant empty popup.
    if (!inline && !trigger.dataset.pvtInlineSource && (detailsShown || !details.textContent?.trim())) {
      if (diceShown || (detailsShown && !dice)) {
        trigger.querySelectorAll('[data-action="toggleVisibility"]').forEach(el => {
          el.removeAttribute('data-action'); el.classList.remove('clickable');
        });
        trigger.classList.add('pneuma-roll-complete');
        continue;
      }
    }
    trigger.dataset.pvtPopover = 'true'; trigger.tabIndex = 0; trigger.removeAttribute('title');
    trigger.setAttribute('aria-label', `Roll ${trigger.textContent?.trim()}. Show roll details`);
    if (!detailsShown) details.classList.add('pneuma-popover-source');
    if (inline instanceof HTMLDetailsElement) inline.open = false;
    const show = () => {
      closePopup(); owner = trigger;
      popup = document.createElement('div'); popup.id = 'pneuma-roll-popover'; popup.setAttribute('role', 'tooltip');
      popup.className = 'pneuma-roll-popover';
      // Popup lives under body, outside card selectors. Carry the active palette
      // explicitly; standalone popup CSS owns its compact native-roll surfaces.
      const cardStyle = getComputedStyle(root);
      for (const key of ['--pvt-bg', '--pvt-panel', '--pvt-ink', '--pvt-muted', '--pvt-line', '--cpr-text-chat-success', '--cpr-text-chat-failure']) popup.style.setProperty(key, cardStyle.getPropertyValue(key));
      popup.style.fontFamily = cardStyle.fontFamily;
      if (!inline && dice && !isShown(dice)) {
        const hiddenDice = dice.cloneNode(true) as HTMLElement;
        hiddenDice.classList.remove('hide'); hiddenDice.hidden = false; hiddenDice.style.removeProperty('display');
        popup.append(hiddenDice);
      }
      const copy = details.cloneNode(true) as HTMLElement; copy.classList.remove('pneuma-popover-source');
      normalDamageDice(copy);
      copy.querySelectorAll('.d10-number-div, .d6-number-div, .generic-number-div, .dice-total, .rollcard-top').forEach(el => el.remove());
      if (diceShown) copy.querySelectorAll('.d10-dice-div, .d6-dice-div, .generic-dice-div, .dice-rolls').forEach(el => el.remove());
      for (const el of [copy, ...Array.from(copy.querySelectorAll<HTMLElement>('*'))]) {
        el.removeAttribute('id'); el.classList.remove('hide'); el.hidden = false;
        if (el.style.display === 'none') el.style.removeProperty('display');
        el.removeAttribute('data-action');
      }
      if (!detailsShown) popup.append(copy);
      if (!popup.textContent?.trim() && !popup.querySelector('img')) { closePopup(); return; }
      document.body.append(popup); trigger.setAttribute('aria-describedby', popup.id);
      const rect = trigger.getBoundingClientRect(); const box = popup.getBoundingClientRect();
      popup.style.left = `${Math.max(8, Math.min(rect.right - box.width, innerWidth - box.width - 8))}px`;
      popup.style.top = `${Math.max(8, Math.min(rect.top - box.height - 8, innerHeight - box.height - 8))}px`;
    };
    trigger.addEventListener('mouseenter', show); trigger.addEventListener('focus', show);
    trigger.addEventListener('mouseleave', closePopup); trigger.addEventListener('blur', closePopup);
    trigger.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); show(); }, true);
    trigger.addEventListener('keydown', event => {
      if (event.key === 'Escape') closePopup();
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopImmediatePropagation(); show(); }
    }, true);
  }
}
