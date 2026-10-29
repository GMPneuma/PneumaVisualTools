/** One evaluation-local inventory snapshot; never retained across document updates. */
export function actorEffectSnapshot(actor:Actor):{native:ActiveEffect[];all:ActiveEffect[];timed:boolean} {
 const native=[...(actor.allApplicableEffects?.()??actor.effects)];
 const all=new Set(native);let timed=false;
 for(const item of actor.items??[]){
  for(const effect of item.effects??[])all.add(effect);
  const flags=(item.flags as Record<string,unknown>)?.['pneuma-combattools'];
  if(flags&&typeof flags==='object'&&Object.keys(flags).length)timed=true;
 }
 for(const effect of all){const duration=effect.duration;if(duration&&(duration.seconds!=null||duration.rounds!=null||duration.turns!=null))timed=true;}
 return {native,all:[...all],timed};
}
