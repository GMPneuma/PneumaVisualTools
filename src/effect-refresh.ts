/** Position and render-only updates do not change actor conditions. Unknown fields invalidate. */
export function tokenEffectsChanged(changes:Record<string,unknown>):boolean {
 const visual=new Set(['x','y','elevation','rotation','width','height','texture','sort','locked','lockRotation','name','alpha']);
 const ignores=['flags.pneuma-combattools.movement','flags.pneuma-combattools.aoeEscape'];
 const meaningful=(value:Record<string,unknown>,prefix=''):boolean=>Object.entries(value).some(([key,entry])=>{
  const path=prefix?`${prefix}.${key}`:key;
  if(visual.has(path.split('.')[0]!)||ignores.some(ignore=>path===ignore||path.startsWith(ignore+'.')))return false;
  if(entry&&typeof entry==='object'&&!Array.isArray(entry))return meaningful(entry as Record<string,unknown>,path);
  return true;
 });
 return meaningful(changes);
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
