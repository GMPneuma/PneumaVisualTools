import {createHumanityOverlay, type HumanityStage} from './humanity-overlay.js';
const MODULE='pneuma-visualtools';
export function humanityStage(value:unknown):HumanityStage|undefined {
 if(typeof value!=='number'||!Number.isFinite(value)||value>=30)return;
 return value>=20?'dissociative':value>=10?'psychopathy':'cyberpsycho';
}
export function registerHumanityEffects():void {
 const overlay=createHumanityOverlay();let ready=false;
 const sync=()=>{
  if(!ready)return;
  if(document.hidden||!game.settings!.get(MODULE,'screenEffects')){overlay.stop();return;}
  const selected=canvas.tokens?.controlled?.filter(token=>token.actor?.isOwner&&token.isVisible);
  const actor=selected?.length===1?selected[0]!.actor:game.user?.character;
  const value=(actor?.system as {derivedStats?:{humanity?:{value?:unknown}}}|undefined)?.derivedStats?.humanity?.value;
  const stage=humanityStage(value);if(stage)overlay.start(stage);else overlay.stop();
 };
 Hooks.on('pneumaVisualToolsScreenEffectsChanged',sync);
 Hooks.once('ready',()=>{ready=true;sync();});
 for(const hook of ['controlToken','updateToken','deleteToken','updateActor','updateUser','canvasReady','createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(hook,sync);
 Hooks.on('canvasTearDown',()=>overlay.stop());
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('pagehide',()=>overlay.stop());
}
