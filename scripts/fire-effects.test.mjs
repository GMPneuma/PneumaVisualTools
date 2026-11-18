import {installEffectHarness} from './effect-test-harness.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const hooks={},settings=new Map([['screenEffects',{scope:'client',onChange:()=>hooks.pneumaVisualToolsScreenEffectsChanged()}]]);let active=0,enabled=true;
const effect={disabled:false,isSuppressed:false,statuses:new Set(['y4y0rvsz17aj0r4g']),name:'On Fire (Strong)'};
const actor={effects:[effect],isOwner:true};
const context=vm.createContext({game:{settings:{get:()=>enabled,register:(m,k,v)=>settings.set(k,v)},user:{character:actor}},canvas:{tokens:{controlled:[]}},Hooks:{once:(k,f)=>hooks[k]=f,on:(k,f)=>hooks[k]=f},document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},createFlameOverlay:()=>({start:n=>active=n,stop:()=>active=0})});
const flush=await installEffectHarness(context,hooks);
vm.runInContext((await readFile('dist/fire-status.js','utf8')).replace(/export /g,''),context);
vm.runInContext((await readFile('dist/fire-effects.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'')+'\nregisterFireEffects();',context);
hooks.ready();assert.equal(active,2);effect.disabled=true;hooks.updateActiveEffect();assert.equal(active,0);effect.disabled=false;enabled=false;settings.get('screenEffects').onChange();assert.equal(active,0);enabled=true;hooks.updateActiveEffect();assert.equal(active,2);hooks.canvasTearDown();assert.equal(active,0);
console.log('Fire status lifecycle, toggle, strength and teardown passed');
context.game.time={worldTime:0};effect.duration={};hooks.updateActiveEffect();assert.equal(active,2);
effect.system={isSuppressed:true};hooks.updateActiveEffect();assert.equal(active,0);effect.system={};
effect.duration={remaining:0};hooks.updateCombat({}, {turn:1});assert.equal(active,0,'expired combat fire is ignored');
effect.duration={seconds:1,startTime:0};hooks.updateActiveEffect();assert.equal(active,2);context.game.time.worldTime=1;hooks.updateWorldTime();assert.equal(active,0,'world-time expiry stops flames');
effect.duration={};actor.effects=[];const item={parent:actor,effects:[effect]};actor.items=[item];actor.allApplicableEffects=()=>actor.items.flatMap(i=>i.effects);
hooks.createItem(item);assert.equal(active,2);actor.items=[];hooks.deleteItem(item);assert.equal(active,0,'deleting the source Item stops flames');
actor.items=[item];hooks.createItem(item);assert.equal(active,2);effect.system={isSuppressed:true};hooks.updateItem(item);assert.equal(active,0,'Item suppression refreshes flames');
effect.system={};hooks.updateItem(item);assert.equal(active,2);item.effects=[];hooks.deleteActiveEffect(effect);assert.equal(active,0);
console.log('Fire expiry, system suppression and Item deletion regressions passed');

const renderer=vm.createContext({
 window:{addEventListener(){}},document:{addEventListener(){},createElement:()=>({
  getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})}),
 })},matchMedia:()=>({addEventListener(){}}),
});
const procedural=(await readFile('dist/fire-procedural.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'');
vm.runInContext(procedural+`
 const flames=createFlameOverlay();
 Float32Array.prototype.fill=()=>{throw Error('Cleared idle fire field');};
 flames.stop();flames.stop();
`,renderer);
