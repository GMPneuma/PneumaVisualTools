import assert from 'node:assert/strict';
import {actorRefreshCandidates,tokenEffectsChanged,frameRefresh,conditionPublisher,watchScreenTokenVisibility} from '../dist/effect-refresh.js';

for(const changes of [{x:10,y:20},{rotation:90,width:2,'texture.scaleX':-1},{x:20,flags:{'pneuma-combattools':{movement:{spent:2}}}},{'flags.pneuma-combattools.aoeEscape':{id:'move'}}])assert.equal(tokenEffectsChanged(changes),false);
for(const changes of [{hidden:true},{actorId:'new'},{delta:{effects:[]}},{'delta.items':[]},{flags:{'pneuma-combattools':{flashbang:{id:'new'}}}},{unknown:true}])assert.equal(tokenEffectsChanged(changes),true);
const frames=new Map();let frameId=0,runs=0;
globalThis.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const flush=()=>{const work=[...frames.values()];frames.clear();for(const fn of work)fn();};
const batch=frameRefresh(()=>runs++);
for(let i=0;i<100;i++)batch.schedule();
assert.equal(frames.size,1);flush();assert.equal(runs,1);
batch.schedule();batch.cancel();flush();assert.equal(runs,1);
const emitted=[],hooks=new Map();
globalThis.Hooks={callAll:(...args)=>emitted.push(args),on:(name,fn)=>hooks.set(name,fn)};
const publish=conditionPublisher('changed');
publish([['Actor.a',['poison']]]);publish([['Actor.a',['poison']]]);
assert.deepEqual(emitted,[['changed','Actor.a']]);
publish([['Actor.b',['emp']]]);
assert.deepEqual(emitted.slice(1),[['changed','Actor.a'],['changed','Actor.b']]);
watchScreenTokenVisibility(()=>runs++);
const token={controlled:true,isVisible:true};hooks.get('refreshToken')(token);flush();
const before=runs;
for(let i=0;i<100;i++)hooks.get('refreshToken')(token);
flush();assert.equal(runs,before);
token.isVisible=false;hooks.get('refreshToken')(token);flush();assert.equal(runs,before+1);
token.isVisible=true;hooks.get('refreshToken')(token);hooks.get('canvasTearDown')();flush();assert.equal(runs,before+1);
console.log('Movement field filtering, frame batching, targeted condition publication and visibility transitions passed');

const actorA={uuid:'Actor.a'},actorB={uuid:'Scene.s.Token.b.Actor.b'};
globalThis.canvas={tokens:{placeables:[{actor:actorA},{actor:actorB}]}};
const candidates=actorRefreshCandidates();assert.equal(candidates.take().size,2);assert.equal(candidates.take().size,0);
candidates.mark({parent:{parent:actorB}});assert.deepEqual([...candidates.take().keys()],[actorB.uuid]);
candidates.mark({actor:actorA});candidates.mark(actorA);assert.deepEqual([...candidates.take().keys()],[actorA.uuid]);
assert.deepEqual([...candidates.take(actorB).keys()],[actorB.uuid]);candidates.all();assert.equal(candidates.take().size,2);

for(const changes of [{_regions:['r']},{flags:{'pneuma-scenetools':{vehicleFootprint:{width:2,height:3}}}}])assert.equal(tokenEffectsChanged(changes),false);
assert.equal(tokenEffectsChanged({_regions:['r'],delta:{effects:[]}}),true);
