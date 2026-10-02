import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const calls=[],loads=[];let init;
const context=vm.createContext({Hooks:{once:(name,callback)=>{assert.equal(name,'init');init=callback}},console:{info(){}},ensureChatStyles:()=>calls.push('styles'),registerChatCards:()=>calls.push('cards'),registerChatDice:()=>calls.push('dice'),registerChatDiceMenu:()=>calls.push('diceMenu'),loadFeature:async path=>{loads.push(path);throw Error('Unfinished module loaded: '+path)}});
vm.runInContext((await readFile('dist/release-features.js','utf8')).replace(/export /g,''),context);
const source=(await readFile('dist/main.js','utf8')).replace(/^import .*;\s*/gm,'').replaceAll('import.meta.url',"'file:///module/main.js'").replaceAll('import(', 'loadFeature(');
vm.runInContext(source,context);await init();assert.deepEqual(calls,['styles','cards','dice','diceMenu']);assert.deepEqual(loads,[]);
assert.equal(vm.runInContext('Object.isFrozen(RELEASE_FEATURES)',context),true);
for(const key of ['neuralIntrusion','weaponEffects','fireEffects'])assert.equal(vm.runInContext(`RELEASE_FEATURES.${key}`,context),false);
console.log('0.2.0 startup enables chat/dice only; no unfinished modules load or register.');
