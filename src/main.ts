import { registerChatCards } from "./chat-cards.js";
import { ensureChatStyles } from "./chat-styles.js";
import { registerChatDice } from './chat-dice.js';
import { registerChatDiceMenu } from './chat-dice-settings.js';
import { RELEASE_FEATURES } from './release-features.js';
const MODULE_ID = "pneuma-visualtools";

Hooks.once("init", async () => {
  if (RELEASE_FEATURES.chatCards) {
    ensureChatStyles(import.meta.url);
    registerChatCards();
  }
  if (RELEASE_FEATURES.chatDice) {
    registerChatDice();
    registerChatDiceMenu();
  }
  // Lazy imports keep unfinished modules and their settings/hooks out of initialization.
  if (RELEASE_FEATURES.neuralIntrusion) (await import('./intrusion-effects.js')).registerIntrusionEffects();
  if (RELEASE_FEATURES.weaponEffects) (await import('./weapon-effects.js')).registerWeaponEffects();
  if (RELEASE_FEATURES.fireEffects) (await import('./fire-effects.js')).registerFireEffects();
  console.info(MODULE_ID + " | Initialized");
});
