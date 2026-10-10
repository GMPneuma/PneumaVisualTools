import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const hooks={},settings=new Map([['screenEffects',{scope:'client',onChange:()=>hooks.pneumaVisualToolsScreenEffectsChanged()}]]);let active;
const actor={system:{derivedStats:{humanity:{value:30}}}};
const selected={actor:{isOwner:true,system:{derivedStats:{humanity:{value:15}}}},isVisible:true};
const canvas={tokens:{controlled:[]}};
const document={hidden:false,addEventListener:(k,f)=>hooks[k]=f};
const context=vm.createContext({game:{settings:{get:()=>settings.get('screenEffects').enabled!==false,register:(m,k,v)=>settings.set(k,v)},user:{character:actor}},canvas,Hooks:{once:(k,f)=>hooks[k]=f,on:(k,f)=>hooks[k]=f},document,window:{addEventListener(){}},createHumanityOverlay:()=>({start:stage=>active=stage,stop:()=>active=undefined})});
vm.runInContext((await readFile('dist/humanity-effects.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'')+'\nregisterHumanityEffects();',context);
hooks.ready();assert.equal(active,undefined);
for(const [value,stage] of [[29,'dissociative'],[20,'dissociative'],[19,'psychopathy'],[10,'psychopathy'],[9,'cyberpsycho'],[0,'cyberpsycho'],[-5,'cyberpsycho'],[30,undefined],[NaN,undefined],[undefined,undefined]]) {
 actor.system.derivedStats.humanity.value=value;hooks.updateActor();assert.equal(active,stage);
}
actor.system.derivedStats.humanity.value=25;canvas.tokens.controlled=[selected];hooks.controlToken();assert.equal(active,'psychopathy');
selected.actor.isOwner=false;hooks.controlToken();assert.equal(active,'dissociative');
settings.get('screenEffects').enabled=false;settings.get('screenEffects').onChange();assert.equal(active,undefined);
settings.get('screenEffects').enabled=true;hooks.updateActor();assert.equal(active,'dissociative');
document.hidden=true;hooks.visibilitychange();assert.equal(active,undefined);document.hidden=false;hooks.visibilitychange();assert.equal(active,'dissociative');
hooks.canvasTearDown();assert.equal(active,undefined);
console.log('Humanity thresholds, recovery, ownership, preference and cleanup passed');
