import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

export async function installEffectHarness(context,hooks){
 const frames=new Map(),listeners=new Map();let id=0;
 const flush=()=>{while(frames.size){const pending=[...frames.values()];frames.clear();for(const fn of pending)fn();}};
 context.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
 context.cancelAnimationFrame=id=>frames.delete(id);
 const on=(event,fn)=>{
  const callbacks=listeners.get(event)??[];callbacks.push(fn);listeners.set(event,callbacks);
  hooks[event]=(...args)=>{for(const callback of callbacks)callback(...args);flush();};
 };
 context.Hooks.on=on;context.Hooks.once=on;
vm.runInContext((await readFile('dist/actor-effect-snapshot.js','utf8')).replace(/export /g,''),context);
 vm.runInContext((await readFile('dist/effect-refresh.js','utf8')).replace(/export /g,''),context);
 return flush;
}
