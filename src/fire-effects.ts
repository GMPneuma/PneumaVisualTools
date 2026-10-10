import {createFlameOverlay} from './fire-overlay.js';
import {burningStrength} from './fire-status.js';
const MODULE='pneuma-visualtools';
export function registerFireEffects():void {
 const flames=createFlameOverlay();let ready=false;
 const sync=()=>{if(!ready)return;if(document.hidden||!game.settings!.get(MODULE,'screenEffects')){flames.stop();return}
  const selected=canvas.tokens?.controlled?.filter(token=>token.actor?.isOwner&&token.isVisible);
  const actor=selected?.length===1?selected[0]!.actor:game.user?.character;
  const strength=burningStrength(actor??undefined);if(strength)flames.start(strength);else flames.stop();
 };
 Hooks.on('pneumaVisualToolsScreenEffectsChanged',sync);
 Hooks.once('ready',()=>{ready=true;sync()});
 for(const hook of ['controlToken','updateToken','deleteToken','updateActor','createActiveEffect','updateActiveEffect','deleteActiveEffect','updateUser','canvasReady'])Hooks.on(hook,sync);
 Hooks.on('canvasTearDown',()=>flames.stop());document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',()=>flames.stop());
}
