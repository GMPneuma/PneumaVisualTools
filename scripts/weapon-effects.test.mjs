import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {actionEffects,weaponKey,ammoKey} from '../dist/weapon-effect-events.js';
const flags=value=>({'pneuma-combattools':{...value,rollsRevealed:true}});
for(const name of ['Monowire','Mono-Guard','MONO GUARD','Heavy Monowire'])assert.equal(weaponKey('heavyMelee',name),'whip');
for(const [name,expected] of [['Improvised','thrownAxe'],['Tomahawk','thrownAxe'],['Boomerang','boomerang'],['Boomarang','boomerang'],['Mono-Star','throwingStar'],['Mono Star','throwingStar'],['Grenade','grenade'],['Molotov Cocktail','grenade']])assert.equal(weaponKey('thrownWeapon',name),expected);
for(const [type,title,expected] of [['heavyMelee','Crowbar','melee'],['heavyMelee','Sword','sword'],['lightMelee','Knife','knife'],['heavyMelee','Katana','blade'],['unarmed','Brawling','punch'],['martialArts','Karate','martial']])assert.equal(weaponKey(type,title),expected);
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
  window.FormApplication=class {};window.settings={};window.values={};window.game={settings:{registerMenu(){},register:(_m,key,config)=>{settings[key]=config;values[key]=config.default},get:(_m,key)=>values[key]},user:{isGM:true},messages:[],modules:new Map([['pneuma-combattools',{active:true}]])};
  const actor={isOwner:false,testUserPermission:()=>true,items:new Map()};
  window.source={document:{uuid:'Scene.s.Token.a',parent:{id:'s'}},center:{x:160,y:350},w:60,h:60,isVisible:true,actor};
  window.target={document:{uuid:'Scene.s.Token.b',parent:{id:'s'}},center:{x:750,y:250},w:60,h:60,isVisible:true,actor};
  window.canvas={ready:true,scene:{id:'s'},tokens:{placeables:[source,target]},stage:{worldTransform:{a:1,b:0,c:0,d:1,tx:0,ty:0}},app:{view:document.querySelector('#table'),renderer:{screen:{width:1000,height:650}}}};
  window.msg={id:'historical',visible:true,isContentVisible:true,flags:{'pneuma-combattools':{rollsRevealed:true,exchange:{attacker:source.document.uuid,defender:target.document.uuid,state:'resolved',hit:true,weaponType:'heavyPistol'}}}};game.messages.push(msg);
 });
 const parts=await Promise.all(['weapon-effect-player','weapon-effect-events','weapon-light-config','weapon-light-settings','weapon-light','weapon-effects'].map(async file=>(await readFile(new URL('../dist/'+file+'.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')));
 await page.addScriptTag({content:parts.join('\n')+'\nwindow.playEffect=playWeaponEffect;window.allWeapons=weaponProfiles;window.stopAudio=stopWeaponAudio;window.activeSounds=()=>nodes.size;registerWeaponEffects();'});
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
 for(const privacy of ['invisible','blind','hiddenToken','privateNetrunner','otherScene']){
  await page.evaluate(privacy=>{game.user.isGM=false;values.hideAttackWeapon=false;target.document.hidden=false;const m={...msg,id:privacy,visible:true,isContentVisible:true,blind:false,flags:structuredClone(msg.flags)};
   if(privacy==='invisible')m.visible=false;if(privacy==='blind')m.blind=true;if(privacy==='hiddenToken')target.document.hidden=true;
   if(privacy==='privateNetrunner')m.flags={'pneuma-combattools':{rollsRevealed:true,quickhack:{type:'quickhack',success:true,sourceTokenUuid:source.document.uuid,targetTokenUuid:target.document.uuid,revealAttacker:false}}};
   if(privacy==='otherScene')m.flags['pneuma-combattools'].exchange.sceneId='elsewhere';hooks.createChatMessage.forEach(fn=>fn(m));},privacy);
  assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,privacy+' blocked');
 }
 await page.evaluate(()=>{
  game.user.isGM=true;target.document.hidden=false;
  window.foundry={utils:{getProperty:(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object)}};
  window.areaHighlight={renderable:true};canvas.interface={grid:{getHighlightLayer:()=>areaHighlight}};
  canvas.grid={type:1,getVertices:p=>[{x:p.x,y:p.y},{x:p.x+100,y:p.y},{x:p.x+100,y:p.y+100},{x:p.x,y:p.y+100}]};
  window.areaTemplate={document:{hidden:false,flags:{'pneuma-combattools':{areaMessage:'fallback-area'}}},renderable:true,highlightId:'area',_getGridHighlightPositions:()=>[{x:700,y:200}]};
  canvas.templates={placeables:[areaTemplate]};
  window.areaMsg={id:'fallback-area',visible:true,isContentVisible:true,flags:{'pneuma-combattools':{rollsRevealed:true,aoe:{phase:'responses',attackDiceRevealed:true,kind:'explosive',scene:'s',ammoType:'incendiary',area:{origin:{x:750,y:250}},exchange:{attacker:source.document.uuid,thrownSource:true}}}}};game.messages.push(areaMsg);hooks.createChatMessage.forEach(fn=>fn(areaMsg));
 });
 assert.equal(await page.evaluate(()=>areaTemplate.renderable||areaHighlight.renderable),false,'measurement box hides at animation start');
 await page.waitForTimeout(1500);
 assert.ok(await page.evaluate(()=>{const c=document.querySelector('.pneuma-weapon-effects');return c?.getContext('2d').getImageData(750,250,1,1).data[3]>0;}),'landing burst is visible with native-template fallback and no new Combat Tools API');
 assert.equal(await page.evaluate(()=>areaTemplate.renderable||areaHighlight.renderable),false,'box replaced at impact');
 await page.waitForTimeout(2100);assert.equal(await page.locator('.pneuma-weapon-effects').count(),1,'area stays until resolution, past normal animation duration');
 await page.evaluate(()=>{areaTemplate.renderable=true;areaHighlight.renderable=true;hooks.refreshMeasuredTemplate.forEach(fn=>fn(areaTemplate));});
 assert.equal(await page.evaluate(()=>areaTemplate.renderable||areaHighlight.renderable),false,'native refresh cannot reveal replaced marker');
 await page.evaluate(()=>hooks.canvasTearDown.forEach(fn=>fn()));
 assert.ok(await page.evaluate(()=>areaTemplate.renderable&&areaHighlight.renderable),'unresolved measurement box restored when visuals stop');
 await page.evaluate(()=>{
  const iterator=game.messages[Symbol.iterator];game.messages[Symbol.iterator]=()=>{throw Error('Resume traversed chat history');};
  hooks.canvasReady.forEach(fn=>fn());game.messages[Symbol.iterator]=iterator;
 });
 await page.waitForFunction(()=>!areaTemplate.renderable);
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),1,'unresolved area recovers on scene reload without replaying flight');
 await page.evaluate(()=>{areaMsg.flags['pneuma-combattools'].aoe.resolutionComplete=true;areaMsg.flags['pneuma-combattools'].aoe.areaHidden=true;areaTemplate.document.hidden=true;hooks.updateChatMessage.forEach(fn=>fn(areaMsg));});
 await page.waitForSelector('.pneuma-weapon-effects',{state:'detached'});
 assert.equal(await page.evaluate(()=>areaTemplate.renderable||areaHighlight.renderable),false,'Combat Tools hidden state remains authoritative after fade');
 await page.evaluate(()=>hooks.canvasReady.forEach(fn=>fn()));assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'completed areas never recover');
 await page.evaluate(()=>{
  const state=areaMsg.flags['pneuma-combattools'].aoe;state.resolutionComplete=false;state.areaHidden=false;state.exchange.combatId=null;areaTemplate.document.hidden=false;
  hooks.updateChatMessage.forEach(fn=>fn(areaMsg));
 });
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),1,'noncombat pending areas still recover');
 await page.evaluate(()=>{canvas.templates.placeables=[];hooks.deleteMeasuredTemplate.forEach(fn=>fn(areaTemplate.document));});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'deleting main template stops cached area immediately');
 await page.evaluate(()=>{
  game.modules.get('pneuma-combattools').api={getAreaEffectCells:()=>[[700,200,800,200,800,300,700,300]]};
  hooks.canvasReady.forEach(fn=>fn());
 });
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'historical pending card cannot resurrect a deleted template through footprint API');
 await page.evaluate(()=>{
  canvas.templates.placeables=[areaTemplate];window.areaCombat={started:true,flags:{'pneuma-combattools':{evasionEpoch:'first'}}};game.combats=new Map([['combat',areaCombat]]);
  Object.assign(areaMsg.flags['pneuma-combattools'].aoe.exchange,{combatId:'combat',combatEpoch:'first'});hooks.canvasReady.forEach(fn=>fn());
 });
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),1,'current encounter area recovers');
 await page.evaluate(()=>{areaCombat.started=false;});
 await page.waitForSelector('.pneuma-weapon-effects',{state:'detached'});
 await page.evaluate(()=>hooks.canvasReady.forEach(fn=>fn()));
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'ended encounter cannot recover unresolved historical area');
 await page.evaluate(()=>{areaCombat.started=true;areaCombat.flags['pneuma-combattools'].evasionEpoch='second';hooks.canvasReady.forEach(fn=>fn());});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'reset encounter cannot recover old area');
 await page.evaluate(()=>{game.combats.clear();hooks.canvasReady.forEach(fn=>fn());});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'deleted encounter cannot recover old area');
 await page.evaluate(()=>{game.user.isGM=true;target.document.hidden=false;for(const weapon of Object.keys(window.allWeapons))playEffect({weapon,hit:true,visuals:true,sound:true,volume:.2,intensity:.7,positions:()=>({source:{x:160,y:350},target:{x:750,y:250}})});});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),21);
 await page.waitForFunction(()=>document.querySelectorAll('.pneuma-weapon-effects').length===0);
 await page.evaluate(()=>{values.weaponAnimations=false;msg.id='sound-only';hooks.createChatMessage.forEach(fn=>fn(msg));});
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'sound independent of visuals');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>playEffect({weapon:'quickhack',hit:false,visuals:true,sound:false,volume:.2,intensity:.7,positions:()=>({source:{x:750,y:250},target:{x:160,y:350}})}));
 await page.waitForFunction(()=>document.querySelectorAll('.pneuma-weapon-effects').length===0);

 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{
  values.weaponAnimations=true;values.weaponSounds=false;game.user={id:'gm',isGM:true};game.users={activeGM:{id:'gm'}};
  window.lightDocs=new Map();window.lightPulses=[];canvas.perception={update(){}};
  canvas.scene={id:'s',grid:{distance:2},lights:{has:id=>lightDocs.has(id),find:fn=>[...lightDocs.values()].find(fn),filter:fn=>[...lightDocs.values()].filter(fn)},createEmbeddedDocuments:(_type,rows)=>new Promise(resolve=>{window.releaseLight=()=>{const doc={...rows[0],id:String(lightDocs.size+1),updateSource(changes){Object.assign(this,changes);},async update(changes){if(changes.hidden!==true)throw Error('network update per pulse forbidden');Object.assign(this,changes);},async delete(){lightDocs.delete(this.id);}};doc.object={field:undefined,initializeLightSource(){if(!doc.hidden)lightPulses.push(performance.now());},renderFlags:{set(){}}};lightDocs.set(doc.id,doc);window.latestLight=doc;resolve([doc]);};})};
  window.preparedMessage={...msg,id:'prepared-burst',flags:{'pneuma-combattools':{rollsRevealed:true,exchange:{attacker:source.document.uuid,defender:target.document.uuid,state:'resolved',hit:true,weaponType:'heavySmg',attackMode:'autofire'}}}};
  hooks.createChatMessage.forEach(fn=>fn(preparedMessage));
 });
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'do not start before GM creates OFF light');
 await page.evaluate(()=>releaseLight());await page.waitForTimeout(40);
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'do not start before native placeable draws');
 assert.equal(await page.evaluate(()=>latestLight.hidden),true,'prepared light is off');
 await page.evaluate(()=>latestLight.object.field={});
 await page.waitForSelector('.pneuma-weapon-effects');
 await page.waitForFunction(()=>lightPulses.length===5);
 await page.waitForSelector('.pneuma-weapon-effects',{state:'detached'});
 assert.equal(await page.evaluate(()=>latestLight.hidden),true,'restore local OFF state after playback');
 await page.evaluate(()=>{
  game.user={id:'player',isGM:false};values.hideAttackWeapon=true;lightPulses.length=0;
  preparedMessage={...preparedMessage,id:'player-hidden-weapon-name'};
  latestLight.flags['pneuma-visualtools'].attackFlash.key=preparedMessage.id+':attack';
  hooks.createChatMessage.forEach(fn=>fn(preparedMessage));
 });
 await page.waitForSelector('.pneuma-weapon-effects');
 await page.waitForFunction(()=>lightPulses.length===5);
 await page.waitForSelector('.pneuma-weapon-effects',{state:'detached'});
 assert.equal(await page.evaluate(()=>latestLight.hidden),true,'player renders five native pulses with weapon names hidden, then restores OFF');
 await page.evaluate(()=>{
  lightPulses.length=0;preparedMessage={...preparedMessage,id:'master-off-mid-burst'};
  latestLight.flags['pneuma-visualtools'].attackFlash.key=preparedMessage.id+':attack';hooks.createChatMessage.forEach(fn=>fn(preparedMessage));
 });
 await page.waitForFunction(()=>lightPulses.length>0);
 await page.evaluate(()=>{values.weaponLighting=false;hooks.pneumaWeaponLightingChanged.forEach(fn=>fn());window.pulsesAtDisable=lightPulses.length;});
 assert.equal(await page.evaluate(()=>latestLight.hidden),true,'master off immediately restores active light OFF');
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),1,'lighting master does not stop projectile animation');
 await page.waitForSelector('.pneuma-weapon-effects',{state:'detached'});
 assert.equal(await page.evaluate(()=>lightPulses.length),await page.evaluate(()=>pulsesAtDisable),'no later burst flashes after master off');
 await page.evaluate(()=>values.weaponLighting=true);
 // Reproduce the reported case: ordinary tokens outside current vision must not prevent a public vision flash.
 for(const unseen of ['source','target']){
  await page.evaluate(unseen=>{
   stopAudio();values.weaponSounds=true;values.weaponLightVision=true;
   source.isVisible=unseen!=='source';target.isVisible=unseen!=='target';lightPulses.length=0;window.perceptionFlags=[];
   canvas.perception.update=flags=>perceptionFlags.push(flags);
   preparedMessage={...preparedMessage,id:'vision-flash-'+unseen};
   latestLight.vision=true;latestLight.flags['pneuma-visualtools'].attackFlash.key=preparedMessage.id+':attack';
   hooks.createChatMessage.forEach(fn=>fn(preparedMessage));
  },unseen);
  await page.waitForFunction(()=>lightPulses.length===5);
  assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'unseen '+unseen+' runs native light pulses without projectile artwork');
  assert.equal(await page.evaluate(()=>activeSounds()),0,'unseen attack schedules no audio');
  assert.ok(await page.evaluate(()=>perceptionFlags.some(flags=>flags.refreshVision)),'native vision refresh requested');
  await page.waitForFunction(()=>latestLight.hidden);
  await page.evaluate(()=>hooks.canvasTearDown.forEach(fn=>fn()));
 }
 for(const blocked of ['vision-off','lighting-off','hidden-source','hidden-target','blind','whisper','invisible-message','hidden-content','visuals-off','no-gm']){
  await page.evaluate(blocked=>{
   source.isVisible=false;target.isVisible=true;source.document.hidden=false;target.document.hidden=false;
   values.weaponAnimations=true;values.weaponLightVision=blocked!=='vision-off';values.weaponLighting=blocked!=='lighting-off';
   game.users.activeGM=blocked==='no-gm'?null:{id:'gm'};lightPulses.length=0;
   const m={...preparedMessage,id:'blocked-vision-'+blocked,blind:false,whisper:[],visible:true,isContentVisible:true};
   if(blocked==='hidden-source')source.document.hidden=true;if(blocked==='hidden-target')target.document.hidden=true;
   if(blocked==='blind')m.blind=true;if(blocked==='whisper')m.whisper=['player'];if(blocked==='invisible-message')m.visible=false;
   if(blocked==='hidden-content')m.isContentVisible=false;if(blocked==='visuals-off')values.weaponAnimations=false;
   latestLight.vision=true;latestLight.flags['pneuma-visualtools'].attackFlash.key=m.id+':attack';
   hooks.createChatMessage.forEach(fn=>fn(m));
  },blocked);
  await page.waitForTimeout(60);
  assert.equal(await page.evaluate(()=>lightPulses.length),0,blocked+' cannot reveal unseen tokens');
  assert.equal(await page.evaluate(()=>activeSounds()),0,blocked+' remains silent');
  assert.equal(await page.locator('.pneuma-weapon-effects').count(),0);
 }
 await page.evaluate(()=>{
  source.isVisible=false;target.isVisible=true;source.document.hidden=false;target.document.hidden=false;
  values.weaponAnimations=true;values.weaponLightVision=true;game.users.activeGM={id:'gm'};lightPulses.length=0;
  preparedMessage={...preparedMessage,id:'cancel-unseen-before-ready'};latestLight.object.field=undefined;
  latestLight.flags['pneuma-visualtools'].attackFlash.key=preparedMessage.id+':attack';
  hooks.createChatMessage.forEach(fn=>fn(preparedMessage));hooks.deleteChatMessage.forEach(fn=>fn(preparedMessage));latestLight.object.field={};
 });
 await page.waitForTimeout(80);
 assert.equal(await page.evaluate(()=>lightPulses.length),0,'cancelling unseen preparation cannot produce a late reveal');
 assert.equal(await page.evaluate(()=>latestLight.hidden),true);
 await page.evaluate(()=>{source.isVisible=true;target.isVisible=true;values.weaponLightSettings={};values.weaponLighting=true;});
 await page.evaluate(()=>{game.user={id:'gm',isGM:true};});
 await page.evaluate(()=>{preparedMessage={...preparedMessage,id:'cancel-before-ready'};hooks.createChatMessage.forEach(fn=>fn(preparedMessage));});
 await page.evaluate(()=>{hooks.deleteChatMessage.forEach(fn=>fn(preparedMessage));releaseLight();});
 await page.waitForTimeout(60);
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'deleting message cancels preparation before animation');
 await page.evaluate(()=>stopAudio());assert.deepEqual(errors,[]);
 console.log('Runtime effects: unseen attacker/target vision flashes without artwork/audio, vision-off/private/hidden guards, unseen cancellation, visible player bursts, history/dedup, AoE, current scene, all 15 renderers and cleanup passed.');
}finally{await browser.close()}
