import {createFlameOverlay} from './fire-overlay.js';
const MODULE='pneuma-visualtools';
declare global {interface SettingConfig {'pneuma-visualtools.fireScreenEffects':boolean}}
const fireIds=new Map([['r4mbggwd1jmrvhjt',1],['y4y0rvsz17aj0r4g',2],['ss6oigx5fylz0luk',3],['burning',1],['onfire',1],['on-fire',1]]);
export function burningStrength(actor:Actor|undefined):number {
 if(!actor)return 0;let level=0;
 for(const effect of actor.allApplicableEffects?.()??actor.effects){if(effect.disabled||effect.isSuppressed)continue;
  for(const id of effect.statuses)level=Math.max(level,fireIds.get(id)??0);
  if(/^on fire(?:\s*\((mild|strong|deadly)\))?$/i.test(effect.name??''))level=Math.max(level,/deadly/i.test(effect.name??'')?3:/strong/i.test(effect.name??'')?2:1);
 }
 return level;
}
export function registerFireEffects():void {
 const flames=createFlameOverlay();let ready=false;
 const sync=()=>{if(!ready)return;if(document.hidden||!game.settings!.get(MODULE,'fireScreenEffects')){flames.stop();return}
  const selected=canvas.tokens?.controlled?.filter(token=>token.actor?.isOwner&&token.isVisible);
  const actor=selected?.length===1?selected[0]!.actor:game.user?.character;
  const strength=burningStrength(actor??undefined);if(strength)flames.start(strength);else flames.stop();
 };
 game.settings!.register(MODULE,'fireScreenEffects',{name:'Show On Fire screen flames',hint:'Procedural flames along the bottom edge for your single controlled owned token, otherwise your assigned character. Works with active burning statuses; reduced motion uses a stationary glow. Local preference.',scope:'client',config:true,type:Boolean,default:true,onChange:sync});
 Hooks.once('ready',()=>{ready=true;sync()});
 for(const hook of ['controlToken','updateToken','deleteToken','updateActor','createActiveEffect','updateActiveEffect','deleteActiveEffect','updateUser','canvasReady'])Hooks.on(hook,sync);
 Hooks.on('canvasTearDown',()=>flames.stop());document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',()=>flames.stop());
}
