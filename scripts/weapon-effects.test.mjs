import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {actionEffects,weaponKey,ammoKey} from '../dist/weapon-effect-events.js';
const flags=value=>({'pneuma-combattools':{...value,rollsRevealed:true}});
const exchange={attacker:'Scene.s.Token.a',defender:'Scene.s.Token.b',state:'waiting',weaponType:'assaultRifle',attackMode:'autofire',hit:true};
assert.deepEqual(actionEffects('a',flags({exchange})),[]);
assert.deepEqual(actionEffects('a',{'pneuma-combattools':{exchange:{...exchange,state:'resolved'}}}),[],'resolved state alone does not mean dice finished');
assert.equal(actionEffects('a',flags({exchange:{...exchange,state:'resolved'}}))[0].mode,'auto');
assert.equal(weaponKey('heavySmg'),'smg');assert.equal(weaponKey('heavyMelee','Katana'),'blade');assert.equal(weaponKey('assaultRifle','Sniper Rifle'),'sniper');assert.equal(ammoKey('Armor Piercing'),'armorPiercing');
const area={phase:'responses',attackDiceRevealed:false,scene:'s',kind:'explosive',exchange,area:{origin:{x:600,y:350}},rows:[{state:'hit'},{state:'hit'}]};
assert.deepEqual(actionEffects('b',flags({aoe:area})),[]);
assert.equal(actionEffects('b',flags({aoe:{...area,attackDiceRevealed:true}})).length,1);
assert.deepEqual(actionEffects('b',flags({aoe:{...area,phase:'scatter',attackDiceRevealed:true}})),[]);
assert.equal(actionEffects('c',flags({quickhack:{type:'jackIn',success:true,sourceTokenUuid:exchange.attacker,targetTokenUuid:exchange.defender,revealAttacker:false}}))[0].privateSource,true);
assert.equal(actionEffects('d',flags({grapple:{state:'choice',source:{token:exchange.attacker},target:{token:exchange.defender},attack:{total:12},defense:{total:14}}}))[0].hit,false);
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1000,height:650}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<button id="unlock">Unlock audio</button><canvas id="table" width="1000" height="650"></canvas><style>body{margin:0;background:#101e26}#table{position:absolute;inset:0;pointer-events:none}button{position:relative;z-index:100}</style>');
 await page.evaluate(()=>{
  window.hooks={};window.Hooks={on:(name,fn)=>{(hooks[name]??=[]).push(fn)},once:(name,fn)=>{(hooks[name]??=[]).push(fn)}};
  window.settings={};window.values={};window.game={settings:{register:(_m,key,config)=>{settings[key]=config;values[key]=config.default},get:(_m,key)=>values[key]},user:{isGM:true},messages:[],modules:new Map([['pneuma-combattools',{active:true}]])};
  const actor={isOwner:false,testUserPermission:()=>true,items:new Map()};
  window.source={document:{uuid:'Scene.s.Token.a',parent:{id:'s'}},center:{x:160,y:350},w:60,h:60,isVisible:true,actor};
  window.target={document:{uuid:'Scene.s.Token.b',parent:{id:'s'}},center:{x:750,y:250},w:60,h:60,isVisible:true,actor};
  window.canvas={ready:true,scene:{id:'s'},tokens:{placeables:[source,target]},stage:{worldTransform:{a:1,b:0,c:0,d:1,tx:0,ty:0}},app:{view:document.querySelector('#table'),renderer:{screen:{width:1000,height:650}}}};
  window.msg={id:'historical',visible:true,isContentVisible:true,flags:{'pneuma-combattools':{rollsRevealed:true,exchange:{attacker:source.document.uuid,defender:target.document.uuid,state:'resolved',hit:true,weaponType:'heavyPistol'}}}};game.messages.push(msg);
 });
 const parts=await Promise.all(['weapon-effect-player','weapon-effect-events','weapon-effects'].map(async file=>(await readFile(new URL('../dist/'+file+'.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')));
 await page.addScriptTag({content:parts.join('\n')+'\nwindow.playEffect=playWeaponEffect;window.allWeapons=weaponProfiles;window.stopAudio=stopWeaponAudio;registerWeaponEffects();'});
 await page.evaluate(()=>hooks.ready.forEach(fn=>fn()));await page.click('#unlock');
 await page.evaluate(()=>hooks.updateChatMessage.forEach(fn=>fn(msg)));
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'history never animates');
 await page.evaluate(()=>{msg.id='fresh';hooks.createChatMessage.forEach(fn=>fn(msg));hooks.updateChatMessage.forEach(fn=>fn(msg));});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),1,'repeated writes play once');
 await page.evaluate(()=>hooks.canvasTearDown.forEach(fn=>fn()));assert.equal(await page.locator('.pneuma-weapon-effects').count(),0);
 await page.evaluate(()=>{msg.id='delayed';msg.flags['pneuma-combattools'].rollsRevealed=false;hooks.createChatMessage.forEach(fn=>fn(msg));});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'hold animation while dice reveal is pending');
 await page.evaluate(()=>{msg.flags['pneuma-combattools'].rollsRevealed=true;hooks.updateChatMessage.forEach(fn=>fn(msg));});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),1,'completion flag releases playback');
 await page.evaluate(()=>hooks.canvasTearDown.forEach(fn=>fn()));
 for(const privacy of ['invisible','blind','concealed','hiddenToken','privateNetrunner','otherScene']){
  await page.evaluate(privacy=>{game.user.isGM=false;values.hideAttackWeapon=false;target.document.hidden=false;const m={...msg,id:privacy,visible:true,isContentVisible:true,blind:false,flags:structuredClone(msg.flags)};
   if(privacy==='invisible')m.visible=false;if(privacy==='blind')m.blind=true;if(privacy==='concealed')values.hideAttackWeapon=true;if(privacy==='hiddenToken')target.document.hidden=true;
   if(privacy==='privateNetrunner')m.flags={'pneuma-combattools':{rollsRevealed:true,quickhack:{type:'quickhack',success:true,sourceTokenUuid:source.document.uuid,targetTokenUuid:target.document.uuid,revealAttacker:false}}};
   if(privacy==='otherScene')m.flags['pneuma-combattools'].exchange.sceneId='elsewhere';hooks.createChatMessage.forEach(fn=>fn(m));},privacy);
  assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,privacy+' blocked');
 }
 await page.evaluate(()=>{game.user.isGM=true;target.document.hidden=false;for(const weapon of Object.keys(window.allWeapons))playEffect({weapon,hit:true,visuals:true,sound:true,volume:.2,intensity:.7,positions:()=>({source:{x:160,y:350},target:{x:750,y:250}})});});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),15);
 await page.waitForFunction(()=>document.querySelectorAll('.pneuma-weapon-effects').length===0);
 await page.evaluate(()=>{values.weaponAnimations=false;msg.id='sound-only';hooks.createChatMessage.forEach(fn=>fn(msg));});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'sound independent of visuals');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>playEffect({weapon:'quickhack',hit:false,visuals:true,sound:false,volume:.2,intensity:.7,positions:()=>({source:{x:750,y:250},target:{x:160,y:350}})}));
 await page.waitForFunction(()=>document.querySelectorAll('.pneuma-weapon-effects').length===0);
 await page.evaluate(()=>stopAudio());assert.deepEqual(errors,[]);
 console.log('Runtime effects: strict planner, one AoE, history/dedup, private/hidden/concealed guards, current scene, all 15 renderers, cleanup, independent sound, and reduced motion passed.');
}finally{await browser.close()}
