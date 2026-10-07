import { registerChatCards } from "./chat-cards.js";
import { ensureChatStyles } from "./chat-styles.js";
import { registerChatDice } from './chat-dice.js';
import { registerChatDiceMenu } from './chat-dice-settings.js';
import { RELEASE_FEATURES } from './release-features.js';
import { registerScenePreviews } from './scene-preview.js';
import { registerAudioTools } from './audio-tools.js';
import { registerWindowEscapeProtection } from './sidebar-escape.js';
import { registerThemeCustomizer } from './theme-customizer.js';
const MODULE_ID = "pneuma-visualtools";

Hooks.once("init", async () => {
  registerThemeCustomizer();
  registerScenePreviews();
  registerAudioTools();
  registerWindowEscapeProtection();
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
