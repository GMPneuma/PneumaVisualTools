import { decorateExchangeHeader, decorateRailDefender } from "./exchange-header.js";
import { arrangeChatCard, installRollPopovers } from "./chat-presentation.js";
const MODULE_ID = "pneuma-visualtools";
declare global {
  interface SettingConfig {
    "pneuma-visualtools.chatCards": boolean;
    "pneuma-visualtools.chatSkin": string;
    "pneuma-visualtools.chatPortraitSource": string;
    "pneuma-visualtools.chatFallbackImage": string;
  }
}

const localize = (key: string) => game.i18n!.localize(key);

/** Visual Tools owns skin selection; update presentation without re-rendering
 * chat or disturbing Combat Tools handlers and expanded roll details. */
function applyChatSkin(root: HTMLElement, skin: string): void {
  const nativePalette = skin === "technical" || skin === "redline";
  root.classList.toggle("pneuma-theme-technical", nativePalette);
  root.classList.remove("pneuma-theme-redline", "pneuma-theme-header");
  root.classList.toggle("pneuma-theme-cyberpunk", !nativePalette);
}

/** Ignore unresolved wildcard textures and Foundry's default placeholder. */
export function portraitPath(value: string | null | undefined): string {
  const path = value?.trim() ?? "";
  return !path || path.includes("*") || path.includes("icons/svg/mystery-man.svg") ? "" : path;
}

export function choosePortrait(preference: string, token: string | null | undefined,
  actor: string | null | undefined, fallback: string): string {
  return (preference === "actor" ? portraitPath(actor) || portraitPath(token)
    : portraitPath(token) || portraitPath(actor)) || fallback.trim();
}

function portraitFor(message: ChatMessage): string {
  const speaker = message.speaker;
  const token = speaker.scene && speaker.token
    ? game.scenes?.get(speaker.scene)?.tokens.get(speaker.token) : undefined;
  const actor = token?.actor ?? (speaker.actor ? game.actors?.get(speaker.actor) : undefined);
  return choosePortrait(game.settings!.get(MODULE_ID, "chatPortraitSource"),
    token?.texture.src ?? actor?.prototypeToken.texture.src, actor?.img,
    game.settings!.get(MODULE_ID, "chatFallbackImage"));
}

export function renderChatCard(message: ChatMessage, root: HTMLElement): void {
  const header = root.querySelector<HTMLElement>(".message-header");
  // Never reconstruct a header or content removed by native visibility handling.
  if (!header || root.classList.contains("pneuma-chat-card") || root.style.display === "none") return;
  if (!message.visible || message.isContentVisible === false || (message.blind && !game.user!.isGM)) return;
  root.classList.add("pneuma-chat-card");
  // Shared layout, separate palette. Keep this setting in Visual Tools if the
  // annotated exchange renderer migrates to Combat Tools.
  applyChatSkin(root, game.settings!.get(MODULE_ID, "chatSkin"));
  const portrait = document.createElement("div");
  portrait.className = "pneuma-chat-portrait";
  portrait.setAttribute("aria-hidden", "true");
  const src = portraitFor(message);
  if (src) {
    const img = document.createElement("img");
    img.alt = "";
    img.src = src;
    img.addEventListener("error", () => {
      const fallback = game.settings!.get(MODULE_ID, "chatFallbackImage").trim();
      if (fallback && img.getAttribute("src") !== fallback) img.src = fallback;
      else img.remove();
    });
    portrait.append(img);
  }
  header.prepend(portrait);
  // Joining these two surfaces creates a stepped outline without covering the action.
  const identity = document.createElement("div");
  identity.className = "pneuma-chat-identity";
  for (const child of Array.from(header.children)) {
    if (child !== portrait) identity.append(child);
  }
  header.append(identity);

  // Move actual nodes, preserving native delegated and direct event handlers.
  const action = root.querySelector<HTMLElement>(".message-content > .rollcard > .rollcard-top");
  if (action) {
    action.classList.add("pneuma-chat-action");
    header.append(action);
  }
  // MIGRATION: exchange-only DOM enrichment; see exchange-header.ts and docs/combat-header-migration.md.
  decorateExchangeHeader(message, root, {
    preference: game.settings!.get(MODULE_ID, "chatPortraitSource"),
    fallback: game.settings!.get(MODULE_ID, "chatFallbackImage"), choose: choosePortrait,
  });
  const recipients = header.querySelector<HTMLElement>(".whisper-to");
  if (recipients) {
    recipients.classList.add("pneuma-chat-recipients");
    recipients.hidden = true;
    const metadata = header.querySelector(".message-metadata") ?? header;
    let tag = metadata.querySelector<HTMLElement>(".chat-mode-indicator");
    if (!tag) {
      tag = document.createElement("span");
      tag.className = "chat-mode-indicator";
      const self = message.whisper.length === 1 && message.whisper[0] === message.author?.id;
      tag.textContent = localize(message.blind ? "CPR.chat.blind" : self ? "CPR.chat.self" : "CPR.chat.whisper");
      metadata.prepend(tag);
    }
    tag.classList.add("pneuma-chat-privacy");
    tag.setAttribute("role", "button");
    tag.tabIndex = 0;
    tag.setAttribute("aria-expanded", "false");
    tag.title = localize("PNEUMA_VISUALTOOLS.ChatRecipients");
    let pinned = false;
    const reveal = (visible: boolean) => {
      recipients.hidden = !visible;
      tag!.setAttribute("aria-expanded", String(visible));
    };
    const toggle = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      pinned = !pinned; reveal(pinned);
    };
    tag.addEventListener("click", toggle);
    tag.addEventListener("mouseenter", () => reveal(true));
    tag.addEventListener("focus", () => reveal(true));
    tag.addEventListener("mouseleave", event => {
      if (!pinned && !(event.relatedTarget instanceof Node && recipients.contains(event.relatedTarget))) reveal(false);
    });
    recipients.addEventListener("mouseleave", event => {
      if (!pinned && !(event.relatedTarget instanceof Node && tag!.contains(event.relatedTarget))) reveal(false);
    });
    tag.addEventListener("blur", () => { if (!pinned) reveal(false); });
    tag.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") toggle(event);
      if (event.key === "Escape") { pinned = false; reveal(false); }
    });
  }
}

const chatSkinOrder = ["cyberpunk", "technical"] as const;
let skinChanges: Promise<unknown> = Promise.resolve();
export function registerChatCards(): void {
  game.keybindings!.register(MODULE_ID, "cycleChatSkin", {
    name: "Cycle chat styles (1 → 2)",
    hint: "Cycle Pneuma Hub and Cyberpunk Minimal on this client. Existing cards update immediately.",
    editable: [{key:"KeyC", modifiers:["Alt", "Shift"]}],
    restricted: false, repeat: false,
    onDown: () => {
      if (!game.settings!.get(MODULE_ID, "chatCards")) return false;
      skinChanges = skinChanges.catch(() => {}).then(async () => {
        const current = game.settings!.get(MODULE_ID, "chatSkin");
        const index = chatSkinOrder.indexOf(current as typeof chatSkinOrder[number]);
        await game.settings!.set(MODULE_ID, "chatSkin", chatSkinOrder[(index + 1) % chatSkinOrder.length]!);
      }).catch(error => { console.error(MODULE_ID, error); ui.notifications!.error("Could not change chat style."); });
      return true;
    },
  });
  game.settings!.register(MODULE_ID, "chatSkin", {
    name: "PNEUMA_VISUALTOOLS.ChatSkinName", hint: "PNEUMA_VISUALTOOLS.ChatSkinHint",
    scope: "client", config: true, type: String, default: "cyberpunk",
    choices: { cyberpunk: "PNEUMA_VISUALTOOLS.ChatSkinCyberpunk", technical: "PNEUMA_VISUALTOOLS.ChatSkinTechnical" },
    onChange: (skin: string) => {
      document.querySelectorAll<HTMLElement>(".chat-message.pneuma-chat-card, .pneuma-chat-composer")
        .forEach(root => applyChatSkin(root, skin));
    },
  });
  game.settings!.register(MODULE_ID, "chatCards", {
    name: "PNEUMA_VISUALTOOLS.ChatCardsName", hint: "PNEUMA_VISUALTOOLS.ChatCardsHint",
    scope: "client", config: true, type: Boolean, default: true, requiresReload: true,
  });
  game.settings!.register(MODULE_ID, "chatPortraitSource", {
    name: "PNEUMA_VISUALTOOLS.ChatPortraitSourceName", hint: "PNEUMA_VISUALTOOLS.ChatPortraitSourceHint",
    // Foundry world settings are GM-controlled and shared by every client.
    scope: "world", config: true, type: String, default: "token", requiresReload: true,
    choices: { token: "PNEUMA_VISUALTOOLS.ChatTokenImage", actor: "PNEUMA_VISUALTOOLS.ChatActorImage" },
  });
  game.settings!.register(MODULE_ID, "chatFallbackImage", {
    name: "PNEUMA_VISUALTOOLS.ChatFallbackImageName", hint: "PNEUMA_VISUALTOOLS.ChatFallbackImageHint",
    scope: "world", config: true, type: String, default: "", requiresReload: true,
  });
  // Register during init: saved chat history is rendered before the ready hook.
  Hooks.on("renderChatLog", (_app: unknown, html: JQuery) => {
    const root = html[0];
    if (!root || !game.settings!.get(MODULE_ID, "chatCards")) return;
    root.classList.add('pneuma-chat-composer');
    applyChatSkin(root, game.settings!.get(MODULE_ID, "chatSkin"));
  });
  Hooks.on("renderChatMessage", (message: ChatMessage, html: JQuery) => {
    if (game.settings!.get(MODULE_ID, "chatCards") && html[0]) {
      renderChatCard(message, html[0]);
      if (html[0].classList.contains('pneuma-chat-card')) {
        if (!html[0].classList.contains('pneuma-layout-participants')) arrangeChatCard(html[0], message);
        decorateRailDefender(message, html[0], {
          preference: game.settings!.get(MODULE_ID, 'chatPortraitSource'),
          fallback: game.settings!.get(MODULE_ID, 'chatFallbackImage'), choose: choosePortrait,
        });
        installRollPopovers(html[0]);
      }
    }
  });
}
