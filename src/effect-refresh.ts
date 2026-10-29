/** Position and render-only updates do not change actor conditions. Unknown fields invalidate. */
export function tokenEffectsChanged(changes:Record<string,unknown>):boolean {
 const visual=new Set(['x','y','elevation','rotation','width','height','texture','sort','locked','lockRotation','name','alpha','_regions']);
 const ignores=['flags.pneuma-combattools.movement','flags.pneuma-combattools.aoeEscape','flags.pneuma-scenetools.vehicleFootprint'];
 const meaningful=(value:Record<string,unknown>,prefix=''):boolean=>Object.entries(value).some(([key,entry])=>{
  const path=prefix?`${prefix}.${key}`:key;
  if(visual.has(path.split('.')[0]!)||ignores.some(ignore=>path===ignore||path.startsWith(ignore+'.')))return false;
  if(entry&&typeof entry==='object'&&!Array.isArray(entry))return meaningful(entry as Record<string,unknown>,path);
  return true;
 });
 return meaningful(changes);
}

/** Combat bookkeeping such as movement and summaries does not change visuals. */
export function combatVisualsChanged(changes:Record<string,unknown>):boolean {
 if(!Object.keys(changes).length)return true;
 const relevant=['started','active','flags.pneuma-combattools.flashbangVisuals','flags.pneuma-combattools.visualExposures','flags.pneuma-combattools.evasionEpoch'];
 const walk=(value:Record<string,unknown>,prefix=''):boolean=>Object.entries(value).some(([key,entry])=>{
  const path=(prefix?prefix+'.':'')+key.replace(/(^|\.)-=/g,'$1');
  return relevant.some(field=>path===field||path.startsWith(field+'.'))||!!entry&&typeof entry==='object'&&!Array.isArray(entry)&&walk(entry as Record<string,unknown>,path);
 });
 return walk(changes);
}

/** Publish only actors whose held condition state actually changed. */
export function conditionPublisher(hook:string){
 let previous=new Map<string,string>();
 return (entries:Iterable<readonly [string,unknown]>)=>{
  const next=new Map(Array.from(entries,([uuid,state])=>[uuid,JSON.stringify(state)]));
  for(const uuid of new Set([...previous.keys(),...next.keys()]))if(previous.get(uuid)!==next.get(uuid))Hooks.callAll(hook,uuid);
  previous=next;
 };
}

/** Coalesce document bursts while retaining synchronous condition bookkeeping. */
export function frameRefresh(work:()=>void) {
 let frame=0;
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;work();});};
 const cancel=()=>{if(frame)cancelAnimationFrame(frame);frame=0;};
 return {schedule,cancel};
}

/** Screen effects depend on selected-token visibility, not its position. */
export function watchScreenTokenVisibility(sync:()=>void){
 const visible=new WeakMap<Token,boolean>(),batch=frameRefresh(sync);
 Hooks.on('refreshToken',(token:Token)=>{
  if(!token.controlled)return;
  const previous=visible.get(token);visible.set(token,token.isVisible);
  if(previous!==token.isVisible)batch.schedule();
 });
 Hooks.on('canvasTearDown',batch.cancel);
}

/** Batch actor hydration without visiting every scene actor for a document edit. */
export function actorRefreshCandidates() {
 let full=true;
 const dirty=new Map<string,Actor>();
 const watched=new Map<string,Actor>();
 const live=new Set<string>();
 return {
  all:()=>{full=true;},
  time:()=>{for(const [id,actor] of watched)dirty.set(id,actor);},
  clear:()=>{dirty.clear();watched.clear();live.clear();full=true;},
  mark:(document: Actor|Item|ActiveEffect|TokenDocument|undefined)=>{
   if(!document){full=true;return;}
   let current: unknown=document;
   while(current){
    const doc=current as {documentName?:string;uuid?:string;actor?:Actor;parent?:unknown};
    if(doc.actor){dirty.set(doc.actor.uuid,doc.actor);return;}
    if(doc.documentName==='Actor'||doc.uuid&&/(?:^|\.)Actor\.[^.]+$/.test(doc.uuid)){dirty.set(doc.uuid!,current as Actor);return;}
    current=doc.parent;
   }
  },
  take:(selected:Actor|null|undefined)=>{
   const actors=new Map(full?[]:dirty);dirty.clear();
   if(full){watched.clear();live.clear();for(const token of canvas.tokens?.placeables??[])if(token.actor){actors.set(token.actor.uuid,token.actor);live.add(token.actor.uuid);}full=false;}
   if(selected)actors.set(selected.uuid,selected);
   for(const id of watched.keys())if(!live.has(id)&&id!==selected?.uuid)watched.delete(id);
   for(const [id,actor] of actors){
    const hasEffects=[...(actor.allApplicableEffects?.()??actor.effects??[])].length>0||[...(actor.items??[])].some(item=>[...(item.effects??[])].length>0);
    if(hasEffects&&(live.has(id)||id===selected?.uuid))watched.set(id,actor);else watched.delete(id);
   }
   return actors;
  }
 };
}
