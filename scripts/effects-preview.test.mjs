import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const api={},menus=new Map(),hooks={},active=new Set(),timers=new Map();let serial=0,tokenEffect,dialog;
const factory=kind=>({start:()=>active.add(kind),stop:()=>active.delete(kind)});
const token={};
const context=vm.createContext({game:{settings:{registerMenu:(m,k,v)=>menus.set(k,v)},modules:{get:()=>api}},canvas:{tokens:{controlled:[token]}},ui:{notifications:{warn(){},info(){}}},FormApplication:class {},Dialog:class {constructor(data){dialog=data;}render(){}},window:{addEventListener(){}},document:{hidden:false,addEventListener(){}},Hooks:{on:(k,f)=>hooks[k]=f},setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),createSubstanceOverlay:factory,createSmashScreenOverlay:()=>factory('smash'),createElectricalOverlay:kind=>factory(kind??'electrical'),createDazzleScreen:()=>factory('dazzle'),createPatternScreen:factory,patternKinds:['radiation','gas','berserker','primeTime','sixgun','timewarp'],createHumanityOverlay:()=>({start:kind=>active.add(kind),stop:()=>{for(const kind of ['dissociative','psychopathy','cyberpsycho'])active.delete(kind);}}),createFlameOverlay:()=>({start:n=>active.add(`fire${n}`),stop:()=>{for(const n of [1,2,3])active.delete(`fire${n}`);}}),createIntrusionGlitches:()=>({sync:()=>active.add('intrusion'),stop:()=>active.delete('intrusion')}),setTokenPreview:(t,kind)=>{tokenEffect=t?kind:undefined;}});
vm.runInContext((await readFile('dist/effects-preview.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'')+'\nregisterEffectsPreview();',context);
assert.equal(menus.get('effectsPreview').restricted,false);
api.api.effectsPreview.show('poison','both',10);assert.equal(tokenEffect,'poison');assert.ok(active.has('poison'));assert.equal([...timers.values()][0].ms,10000);
api.api.effectsPreview.show('smash','token',5);assert.equal(active.size,0);assert.equal(tokenEffect,'smash');
api.api.effectsPreview.show('cyberpsycho','both',5);assert.equal(tokenEffect,undefined,'Humanity preview cannot appear on a token');assert.ok(active.has('cyberpsycho'));
api.api.effectsPreview.stop();assert.equal(active.size,0);assert.equal(tokenEffect,undefined);assert.equal(timers.size,0);
api.api.effectsPreview.tour('screen',2);assert.equal(timers.size,1);const first=[...timers.values()][0];timers.clear();first.fn();assert.ok(active.has('blueGlass'));api.api.effectsPreview.stop();assert.equal(timers.size,0);
api.api.effectsPreview.open();assert.equal(dialog.title,'Visual Effects Preview');assert.match(dialog.content,/Screen \+ selected token/);
console.log('Effect preview menu, modes, auto-stop, tour and Humanity privacy passed');

for(const kind of ['sonic','stunned','nausea','fear']){api.api.effectsPreview.show(kind,'both',5);assert.equal(active.size,0);assert.equal(tokenEffect,undefined);assert.ok(!dialog.content.includes('value="'+kind+'"'));}

for(const kind of ['berserker','primeTime','sixgun','timewarp']){api.api.effectsPreview.show(kind,'both',5);assert.ok(active.has(kind));assert.equal(tokenEffect,kind);assert.ok(dialog.content.includes('value="'+kind+'"'));api.api.effectsPreview.stop();}
