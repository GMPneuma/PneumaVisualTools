import {createElectricalOverlay} from './electrical-overlay.js';
export type ElectricalKind='electrical'|'emp';
type Entry={combat?:string,expires:number};
const held=new Map<string,Map<ElectricalKind,Entry>>();
export function hasElectricalShock(actor:Actor|undefined):boolean {return !!actor&&!!held.get(actor.uuid)?.has('electrical');}
export function hasEMP(actor:Actor|undefined):boolean {
 if(!actor)return false;
 const module=game.modules?.get('pneuma-combattools') as unknown as {active?:boolean,api?:{hasActorEMP?:(actor:Actor)=>boolean}}|undefined;
 return !!(module?.active&&module.api?.hasActorEMP?.(actor))||!!held.get(actor.uuid)?.has('emp');
}
/** Prepared renderer API; gameplay integrations will call this later. */
export function registerElectricalEffects():void {
 const electrical=createElectricalOverlay('electrical'),emp=createElectricalOverlay('emp');let ready=false;
 const sync=()=>{
  if(!ready)return;
  const selected=canvas.tokens?.controlled?.filter(token=>token.actor?.isOwner&&token.isVisible);
  const actor=selected?.length===1?selected[0]!.actor:game.user?.character;
  const now=Number(game.time?.worldTime??0);
  for(const [uuid,entries] of held){for(const [kind,entry] of entries)if(!entry.combat&&now>=entry.expires)entries.delete(kind);if(!entries.size)held.delete(uuid);}
  const visible=!document.hidden&&game.settings!.get('pneuma-visualtools','screenEffects');
  if(visible&&hasElectricalShock(actor??undefined))electrical.start();else electrical.stop();
  if(visible&&hasEMP(actor??undefined))emp.start();else emp.stop();
  Hooks.callAll('pneumaVisualToolsElectricalChanged');
 };
 const activate=(actor:Actor,kind:ElectricalKind)=>{
  if(kind!=='electrical'&&kind!=='emp')return;
  const combat=game.combats?.find(c=>c.started&&c.combatants.some(member=>member.actor?.uuid===actor.uuid));
  const entries=held.get(actor.uuid)??new Map<ElectricalKind,Entry>();entries.set(kind,{combat:combat?.id,expires:Number(game.time?.worldTime??0)+6});held.set(actor.uuid,entries);sync();
 };
 const module=game.modules!.get('pneuma-visualtools') as unknown as {api?:Record<string,unknown>};
 module.api={...module.api,activateElectricalEffect:activate};
 Hooks.once('ready',()=>{ready=true;sync();});
 Hooks.on('updateCombat',(combat:Combat,changes:Record<string,unknown>)=>{for(const [uuid,entries] of held){for(const [kind,entry] of entries)if(entry.combat===combat.id&&(!combat.started||(('turn' in changes||'round' in changes)&&combat.combatant?.actor?.uuid===uuid)))entries.delete(kind);if(!entries.size)held.delete(uuid);}sync();});
 Hooks.on('deleteCombat',(combat:Combat)=>{for(const [uuid,entries] of held){for(const [kind,entry] of entries)if(entry.combat===combat.id)entries.delete(kind);if(!entries.size)held.delete(uuid);}sync();});
 for(const hook of ['controlToken','updateToken','deleteToken','updateActor','createItem','updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect','canvasReady','updateWorldTime','updateUser','pneumaVisualToolsScreenEffectsChanged'])Hooks.on(hook,sync);
 Hooks.on('canvasTearDown',()=>{electrical.stop();emp.stop();});document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',()=>{electrical.stop();emp.stop();});
}
