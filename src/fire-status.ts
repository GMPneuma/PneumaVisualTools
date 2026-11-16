const fireIds=new Map([['r4mbggwd1jmrvhjt',1],['y4y0rvsz17aj0r4g',2],['ss6oigx5fylz0luk',3],['burning',1],['onfire',1],['on-fire',1]]);
export function burningStrength(actor:Actor|undefined,effects?:ActiveEffect[]):number {
 if(!actor)return 0;let level=0;
 for(const effect of effects??actor.allApplicableEffects?.()??actor.effects){
  if(effect.disabled||effect.isSuppressed||(effect as ActiveEffect & {system?:{isSuppressed?:boolean}}).system?.isSuppressed)continue;
  const duration=effect.duration as (typeof effect.duration & {remaining?:number})|undefined;
  if(duration?.remaining!=null&&duration.remaining<=0)continue;
  if(duration?.seconds!=null&&duration.startTime!=null&&Number(game.time?.worldTime??0)>=duration.startTime+duration.seconds)continue;
  for(const id of effect.statuses)level=Math.max(level,fireIds.get(id)??0);
  if(/^on fire(?:\s*\((mild|strong|deadly)\))?$/i.test(effect.name??''))level=Math.max(level,/deadly/i.test(effect.name??'')?3:/strong/i.test(effect.name??'')?2:1);
 }
 return level;
}
