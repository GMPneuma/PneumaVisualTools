import {hasPrimaryDrug} from './substance-effects.js';
import {createPatternScreen} from './remaining-renderers.js';
export type PatternKind='choking1'|'choking2'|'radiation'|'gas'|'blackLace'|'boost'|'synthcoke'|'berserker'|'primeTime'|'sixgun'|'timewarp';
export const patternKinds:PatternKind[]=['choking1','choking2','radiation','gas','blackLace','boost','synthcoke','berserker','primeTime','sixgun','timewarp'];
const held=new Map<string,Map<PatternKind,{combat?:string,expires:number}>>(),cleared=new Map<string,Set<PatternKind>>();
const aliases:Partial<Record<PatternKind,RegExp>>={radiation:/^radiation(?: exposure| \((?:low|high)\))?$/i,gas:/^(gas exposure|tear gas|teargas)$/i};
function marked(actor:Actor,kind:PatternKind):boolean {const match=aliases[kind];return !!match&&[...(actor.allApplicableEffects?.()??actor.effects)].some(e=>{
 const duration=e.duration as typeof e.duration & {remaining?:number};
 if(e.disabled||e.isSuppressed||duration?.remaining!=null&&duration.remaining<=0)return false;
 if(duration?.seconds!=null&&duration.startTime!=null&&Number(game.time?.worldTime??0)>=duration.startTime+duration.seconds)return false;
 return match.test(game.i18n?.localize(e.name??'')??e.name??'')||[...e.statuses].some(id=>match.test(id.replace(/-/g,' '))||(kind==='radiation'&&['qrncrx71vi0kvn12','vaciaiw08jooz1hf'].includes(id)));
});}
function tearGas(actor:Actor):boolean {const module=game.modules?.get('pneuma-combattools') as unknown as {active?:boolean,api?:{getTearGasState?:(actor:Actor)=>unknown}}|undefined;return !!(module?.active&&module.api?.getTearGasState?.(actor));}
export function actorPatternKinds(actor:Actor|undefined):PatternKind[] {
 if(!actor)return [];
 const result=[...(held.get(actor.uuid)?.keys()??[])];
 if(hasPrimaryDrug(actor,'Choking 2','8g65kc038fh7av9k'))result.push('choking2');
 else if(hasPrimaryDrug(actor,'Choking 1','3i5twkh0722lw1bz'))result.push('choking1');
 if((tearGas(actor)||marked(actor,'gas'))&&!result.includes('gas'))result.push('gas');
 for(const [kind,name,id] of [['blackLace','Black Lace','idja1i8m5hhz8ama'],['boost','Boost','vc6wdch7hgjnyceg'],['synthcoke','Synthcoke','bsixucw55vezxc66'],['berserker','Berserker','pneuma-berserker'],['primeTime','Prime Time','pneuma-prime-time'],['sixgun','Sixgun','pneuma-sixgun'],['timewarp','Timewarp','pneuma-timewarp']] as const)if(hasPrimaryDrug(actor,name,id))result.push(kind);
 return result;
}
export function registerRemainingEffects():void {
 const screens=new Map(patternKinds.map(kind=>[kind,createPatternScreen(kind)]));let ready=false;
 const sync=()=>{
  if(!ready)return;
  const selected=canvas.tokens?.controlled?.filter(t=>t.actor?.isOwner&&t.isVisible),actor=selected?.length===1?selected[0]!.actor:game.user?.character;
  const actors=new Map<string,Actor>();if(actor)actors.set(actor.uuid,actor);for(const t of canvas.tokens?.placeables??[])if(t.actor)actors.set(t.actor.uuid,t.actor);
  const now=Number(game.time?.worldTime??0);
  for(const [uuid,entries] of held)for(const [kind,entry] of entries)if(!entry.combat&&now>=entry.expires){entries.delete(kind);const set=cleared.get(uuid)??new Set<PatternKind>();set.add(kind);cleared.set(uuid,set);}
  for(const candidate of actors.values())for(const kind of (Object.keys(aliases) as PatternKind[]).filter(kind=>kind!=='gas')){
   const entries=held.get(candidate.uuid)??new Map();held.set(candidate.uuid,entries);
   if(!marked(candidate,kind)){cleared.get(candidate.uuid)?.delete(kind);continue;}
   if(entries.has(kind)||cleared.get(candidate.uuid)?.has(kind))continue;
   const combat=game.combats?.find(c=>c.started&&c.combatants.some(m=>m.actor?.uuid===candidate.uuid));entries.set(kind,{combat:combat?.id,expires:now+6});
  }
  const active=new Set(actorPatternKinds(actor??undefined));
  for(const [kind,screen] of screens)if(!document.hidden&&game.settings!.get('pneuma-visualtools','screenEffects')&&active.has(kind))screen.start();else screen.stop();
  Hooks.callAll('pneumaVisualToolsPatternsChanged');
 };
 const module=game.modules!.get('pneuma-visualtools') as unknown as {api?:Record<string,unknown>};
 module.api={...module.api,activatePatternEffect:(actor:Actor,kind:PatternKind)=>{if(!patternKinds.includes(kind))return;const combat=game.combats?.find(c=>c.started&&c.combatants.some(m=>m.actor?.uuid===actor.uuid));const entries=held.get(actor.uuid)??new Map();entries.set(kind,{combat:combat?.id,expires:Number(game.time?.worldTime??0)+6});held.set(actor.uuid,entries);cleared.get(actor.uuid)?.delete(kind);sync();}};
 const clear=(combat:Combat,end:boolean)=>{for(const [uuid,entries] of held)for(const [kind,entry] of entries)if(entry.combat===combat.id&&(end||combat.combatant?.actor?.uuid===uuid)){entries.delete(kind);const set=cleared.get(uuid)??new Set<PatternKind>();set.add(kind);cleared.set(uuid,set);}sync();};
 Hooks.once('ready',()=>{ready=true;sync();});
 Hooks.on('updateCombat',(combat:Combat,changes:Record<string,unknown>)=>{if(!combat.started||'round' in changes||'turn' in changes)clear(combat,!combat.started);else sync();});Hooks.on('deleteCombat',(combat:Combat)=>clear(combat,true));
 for(const hook of ['canvasReady','controlToken','updateToken','deleteToken','updateActor','createItem','updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect','updateWorldTime','updateUser','pneumaVisualToolsScreenEffectsChanged','pneumaCombatToolsFlashbangChanged'])Hooks.on(hook,sync);
 const stop=()=>{for(const screen of screens.values())screen.stop();};Hooks.on('canvasTearDown',stop);document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',stop);
}
