import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeFlashSettings,weaponLightConfig,attackBlastRadius} from '../dist/weapon-light-config.js';
import {attackAmmoColor,grenadeVisuals} from '../dist/weapon-effect-player.js';

const registrations={},menus={};let saved,stored={matchAmmo:false,profiles:{}},vision=false;
globalThis.canvas={scene:{grid:{size:100,distance:2,units:'m'}}};
globalThis.game={user:{isGM:true},settings:{register:(_module,key,data)=>registrations[key]=data,registerMenu:(_module,key,data)=>menus[key]=data,
 get:(_module,key)=>key==='weaponLightVision'?vision:key==='weaponLighting'?true:stored,set:async(_module,_key,value)=>{saved=value;stored=value;}}};
globalThis.foundry={utils:{expandObject:flat=>{const out={};for(const [path,value] of Object.entries(flat)){const parts=path.split('.');let obj=out;for(const part of parts.slice(0,-1))obj=obj[part]??={};obj[parts.at(-1)]=value;}return out;}}};
globalThis.FormApplication=class {constructor(){}async close(){this.closed=true;}activateListeners(){}};
const {WeaponLightSettings,registerWeaponLightSettings}=await import('../dist/weapon-light-settings.js');
registerWeaponLightSettings();assert.equal(registrations.weaponLightSettings.scope,'world');assert.equal(menus.weaponLightMenu.restricted,true);
assert.equal(registrations.weaponLighting.default,true);assert.equal(registrations.weaponLighting.scope,'world');assert.equal(registrations.weaponLightVision.scope,'world');
const defaults=normalizeFlashSettings({},2);assert.equal(defaults.profiles.gunfire.dim,6);assert.equal(defaults.profiles.shotgun.bright,4);assert.equal('vision' in defaults.profiles.rocket,false);
const invalid=normalizeFlashSettings({profiles:{gunfire:{color:'bad',alpha:7,bright:-4,dim:NaN},rocket:{bright:12,dim:2}}},2);
assert.equal(invalid.profiles.gunfire.color,'#ffd29a');assert.equal(invalid.profiles.gunfire.alpha,1);assert.equal(invalid.profiles.gunfire.bright,0);assert.equal(invalid.profiles.rocket.dim,12);
const app=new WeaponLightSettings();assert.equal(app.getData().profiles.length,4);assert.equal(app.getData().units,'m');
await app._updateObject(new Event('submit'),{'matchAmmo':true,'profiles.gunfire.color':'#123456','profiles.gunfire.alpha':'0.8','profiles.gunfire.bright':'5','profiles.gunfire.dim':'9','profiles.gunfire.vision':true});
assert.equal(saved.profiles.gunfire.bright,5);assert.equal(saved.profiles.gunfire.dim,9);assert.equal(saved.profiles.gunfire.alpha,.8);assert.equal('vision' in saved.profiles.gunfire,false);assert.ok(app.closed);
assert.equal(weaponLightConfig('pistol',attackAmmoColor('smart')).color,'#74f4b1');
for(const [ammo,visual] of Object.entries(grenadeVisuals))assert.equal(weaponLightConfig('grenade',attackAmmoColor('basic',ammo)).color,visual.color,'same grenade ammo palette');
stored.matchAmmo=false;assert.equal(weaponLightConfig('pistol',attackAmmoColor('smart')).color,'#123456','manual color survives ammo matching');
for(const value of [true,false]){vision=value;for(const weapon of ['pistol','shotgun','grenade','rocket'])assert.equal(weaponLightConfig(weapon).vision,value,'one vision switch covers every profile');}
assert.equal(weaponLightConfig('grenade',undefined,8).bright,8);assert.equal(weaponLightConfig('grenade',undefined,8).dim,10);
stored.profiles.grenade={autoRadius:false,bright:3,dim:7};assert.equal(weaponLightConfig('grenade',undefined,8).bright,3);
assert.equal(attackBlastRadius({'pneuma-combattools':{aoe:{area:{shape:'circle',length:250}}}}),5);
assert.equal(attackBlastRadius({'pneuma-combattools':{aoe:{area:{shape:'square',length:500}}}}),5);
const before=saved;game.user.isGM=false;await new WeaponLightSettings()._updateObject(new Event('submit'),{});assert.equal(saved,before,'player cannot write world config');
const template=await readFile('dist/weapon-light-settings.hbs','utf8');assert.ok(template.includes('type="color"'));assert.ok(!template.includes('.vision'));assert.ok(template.includes('profiles.{{id}}.bright'));assert.ok(template.includes('Match target area'));
console.log('GM-only world menu, native light fields, per-profile saves, radius/intensity validation, manual color preservation and shared ammo palettes passed.');
