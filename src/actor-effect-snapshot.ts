type Snapshot={native:ActiveEffect[];all:ActiveEffect[];timed:boolean};
let snapshots:WeakMap<Actor,Snapshot>|undefined;
/** Share inventory reads only inside one synchronous refresh batch. */
export function withActorEffectSnapshots(work:()=>void):void {
 const previous=snapshots;snapshots=new WeakMap();
 try{work();}finally{snapshots=previous;}
}
/** Outside a refresh batch, always read current document data. */
export function actorEffectSnapshot(actor:Actor):{native:ActiveEffect[];all:ActiveEffect[];timed:boolean} {
 const cached=snapshots?.get(actor);if(cached)return cached;
 const native=[...(actor.allApplicableEffects?.()??actor.effects??[])];
 const all=new Set(native);let timed=false;
 for(const item of actor.items??[]){
  for(const effect of item.effects??[])all.add(effect);
  const flags=(item.flags as Record<string,unknown>)?.['pneuma-combattools'];
  if(flags&&typeof flags==='object'&&Object.keys(flags).length)timed=true;
 }
 for(const effect of all){const duration=effect.duration;if(duration&&(duration.seconds!=null||duration.rounds!=null||duration.turns!=null))timed=true;}
 const result={native,all:[...all],timed};snapshots?.set(actor,result);return result;
}
