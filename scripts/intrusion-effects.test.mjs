import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const hooks = {}, settings = new Map();
let enabled = true, combat, actor, current, stopped = 0;
const context = vm.createContext({
 game:{modules:{get:()=>combat},settings:{get:()=>enabled,register:(m,k,v)=>settings.set(k,v)}},
 Hooks:{once:(k,f)=>hooks[k]=f,on:(k,f)=>hooks[k]=f},
 createIntrusionGlitches:state=>({sync:()=>current=state(),stop:()=>{current=undefined;stopped++;}})
});
vm.runInContext((await readFile('dist/intrusion-effects.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'')+'\nregisterIntrusionEffects();',context);
hooks.ready(); assert.equal(current,undefined);
combat={active:true}; hooks.canvasReady(); assert.equal(current,undefined);
combat.api={getNeuralIntrusionActor:()=>actor}; actor='Actor.test';
hooks.pneumaCombatToolsNeuralIntrusionChanged(); assert.equal(current,actor);
enabled=false;settings.get('neuralIntrusionGlitches').onChange();assert.equal(current,undefined);
enabled=true;settings.get('neuralIntrusionGlitches').onChange();assert.equal(current,actor);
actor=undefined;hooks.pneumaCombatToolsNeuralIntrusionChanged();assert.equal(current,undefined);
actor='Actor.test';hooks.ready();assert.equal(current,actor,'Reads existing connection on ready');
combat.active=false;hooks.canvasReady();assert.equal(current,undefined);
hooks.canvasTearDown();assert.equal(stopped,1);
assert.equal(settings.get('neuralIntrusionGlitches').scope,'client');
console.log('Visual Tools optional integration, player setting and lifecycle passed');
