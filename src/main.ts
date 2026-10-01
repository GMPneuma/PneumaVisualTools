import {registerIntrusionEffects} from "./intrusion-effects.js";
import { registerChatCards } from "./chat-cards.js";
import { ensureChatStyles } from "./chat-styles.js";
import {registerChatDice} from './chat-dice.js';
import {registerChatDiceMenu} from './chat-dice-settings.js';
const MODULE_ID = "pneuma-visualtools";

Hooks.once("init", () => {
  ensureChatStyles(import.meta.url);
  registerChatDice();
  registerChatDiceMenu();
  registerChatCards();
  registerIntrusionEffects();
  console.info(MODULE_ID + " | Initialized");
});
