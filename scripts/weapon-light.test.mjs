import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const runtime=(await Promise.all(['weapon-light-config','weapon-light'].map(file=>readFile('dist/'+file+'.js','utf8')))).join('\n').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
let now=0,next=0;const jobs=new Map(),clients=[],server=new Map(),pendingCreates=[];let creates=0,deletes=0,writes=0;
const settle=async()=>{for(let i=0;i<50;i++)await Promise.resolve();};
const advance=async ms=>{now+=ms;for(const [id,job] of [...jobs])if(job.at<=now){jobs.delete(id);job.fn();}await settle();};
function client(isGM){const local=new Map(),events=[];
 const scene={id:'scene',grid:{distance:2},lights:{has:id=>local.has(id),find:fn=>[...local.values()].find(fn),filter:fn=>[...local.values()].filter(fn)},createEmbeddedDocuments(type,rows){assert.ok(isGM);assert.equal(type,'AmbientLight');creates++;return new Promise(resolve=>pendingCreates.push(()=>{const id=String(++next);server.set(id,{...structuredClone(rows[0]),id});replicate(id);resolve([local.get(id)]);}));}};
 const context=vm.createContext({console,Map,Set,Date:class extends Date{static now(){return now;}},setTimeout:(fn,ms)=>{const id=++next;jobs.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>jobs.delete(id),setInterval:()=>0,clearInterval(){},matchMedia:()=>({matches:false}),document:{hidden:false},window:{addEventListener(){}},Hooks:{once(){},on(){}},game:{user:{id:isGM?'gm':'player',isGM},users:{activeGM:{id:'gm'}},settings:{get:()=>true}},canvas:{ready:true,scene,perception:{update:flags=>events.push({perception:flags})}},foundry:{utils:{randomID:()=>String(++next),getProperty:(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o)}}});
 vm.runInContext(runtime+';globalThis.make=createWeaponLight;',context);const result={context,local,events,scene};clients.push(result);return result;
}
function replicate(id){for(const c of clients){const data=structuredClone(server.get(id)),old=c.local.get(id);if(old){Object.assign(old,data);continue;}const doc={...data,updateSource(changes){Object.assign(this,changes);c.events.push({...changes});},async update(changes){assert.ok(c.context.game.user.isGM,'only GM may prepare/release');assert.equal(changes.hidden,true,'server may never turn a pool light ON');writes++;Object.assign(server.get(id),structuredClone(changes));replicate(id);},async delete(){deletes++;throw Error('pooled lights must not be deleted');}};doc.object={field:undefined,initializeLightSource(){c.events.push('native');},renderFlags:{set(){}}};c.local.set(id,doc);}}
const gm=client(true),player=client(false),marker=doc=>doc.flags['pneuma-visualtools'].attackFlash;
const prepare=(c,key='attack',enabled=true)=>c.context.make('rifle',{x:300,y:400},enabled,key);
const g=prepare(gm),p=prepare(player);let gReady=false,pReady=false;g.ready.then(()=>gReady=true);p.ready.then(()=>pReady=true);await settle();assert.equal(creates,1);pendingCreates.shift()();await settle();const id=[...server.keys()][0];assert.equal(server.get(id).hidden,true);assert.equal(server.get(id).x,300);assert.equal(server.get(id).walls,true);assert.equal(server.get(id).config.dim,6);
await advance(20);assert.ok(!gReady&&!pReady);gm.local.get(id).object.field={};await advance(20);assert.ok(gReady&&!pReady);const before=writes;
g.pulse('source',{x:330,y:400});assert.equal(gm.local.get(id).hidden,false);assert.equal(server.get(id).hidden,true);player.local.get(id).object.field={};await advance(20);assert.ok(pReady);p.pulse('source',{x:345,y:400});await advance(50);assert.equal(gm.local.get(id).hidden,true);assert.equal(player.local.get(id).hidden,false);await advance(20);assert.equal(player.local.get(id).hidden,true);
for(let i=0;i<8;i++){p.pulse('source',{x:350+i,y:400});await advance(70);}assert.equal(writes,before,'no per-bullet server writes');g.stop();await advance(4999);assert.equal(marker(server.get(id)).key,'attack');await advance(1);assert.equal(marker(server.get(id)).key,'');assert.equal(server.size,1,'keep off light for reuse');
const reused=prepare(gm,'second');await settle();await advance(20);await reused.ready;assert.equal(creates,1,'next sequential attack reuses existing document');assert.equal(marker(server.get(id)).key,'second');reused.pulse('source',{x:500,y:500});p.stop();assert.equal(player.local.get(id).hidden,true,'old controller cannot restore obsolete state');assert.equal(gm.local.get(id).hidden,false);assert.equal(server.get(id).hidden,true);
await advance(14000);assert.equal(marker(server.get(id)).key,'second','old lease expiry cannot release a newly assigned slot');reused.stop();await advance(5000);assert.equal(marker(server.get(id)).key,'');
const a=prepare(gm,'parallel-a'),b=prepare(gm,'parallel-b');await settle();assert.equal(creates,2,'overlapping attacks obtain separate lights');pendingCreates.shift()();await settle();for(const c of clients)for(const d of c.local.values())d.object.field={};await advance(20);await Promise.all([a.ready,b.ready]);assert.equal(server.size,2);assert.equal(new Set([...server.values()].map(d=>marker(d).key)).size,2);a.stop();b.stop();await advance(5000);
const cancelled=prepare(gm,'cancelled');cancelled.stop();await settle();assert.ok([...server.values()].every(d=>d.hidden));assert.equal(creates,2,'cancelled attack reuses slot without orphan creation');assert.equal(deletes,0);
const claims=Array.from({length:9},(_,i)=>prepare(gm,'capacity-'+i));await settle();while(pendingCreates.length){pendingCreates.shift()();await settle();}assert.equal(server.size,8,'pool is capped at eight concurrent slots');await advance(3001);claims.forEach(c=>c.stop());await advance(5000);assert.ok([...server.values()].every(d=>d.hidden&&marker(d).key===''));
const rocket=gm.context.make('rocket',{x:100,y:100},true,'moving-rocket',undefined,8);await settle();await advance(20);await rocket.ready;
const rocketId=[...server.values()].find(d=>marker(d).key==='moving-rocket').id,rocketDoc=gm.local.get(rocketId),rocketWrites=writes;
rocket.move({x:150,y:100});assert.equal(rocketDoc.x,150);assert.equal(rocketDoc.config.bright,1);assert.equal(rocketDoc.config.dim,2);assert.equal(rocketDoc.hidden,false);
rocket.move({x:170,y:100});assert.equal(rocketDoc.x,150,'movement refresh is throttled');await advance(34);rocket.move({x:300,y:120});assert.equal(rocketDoc.x,300);
assert.equal(server.get(rocketId).hidden,true);assert.equal(writes,rocketWrites,'rocket travel has no server writes');
rocket.pulse('impact',{x:600,y:100});assert.equal(rocketDoc.config.bright,8);assert.equal(rocketDoc.config.dim,10);assert.equal(rocketDoc.x,600);await advance(300);assert.equal(rocketDoc.hidden,true);rocket.stop();await advance(5000);
gm.context.game.settings.get=(_module,key)=>key==='weaponLighting'?false:true;
const disabled=prepare(gm,'disabled');assert.equal(disabled.ready,undefined);await settle();assert.ok([...server.values()].every(d=>marker(d).key!=='disabled'),'master off does not reserve a light');gm.context.game.settings.get=()=>true;
const privateLight=prepare(player,'private',false);assert.equal(privateLight.ready,undefined);
gm.context.game.settings.get=(_module,key)=>key==='weaponLightSettings'?{matchAmmo:true,profiles:{grenade:{color:'#334455',alpha:.77,bright:9,dim:14,autoRadius:false}}}:true;
const customized=gm.context.make('grenade',{x:600,y:700},true,'customized','#54ad49');await settle();for(const c of clients)for(const d of c.local.values())d.object.field={};await advance(20);await customized.ready;const customData=[...server.values()].find(d=>marker(d).key==='customized');assert.equal(customData.config.color,'#54ad49');assert.equal(customData.config.bright,9);assert.equal(customData.config.dim,14);assert.equal(customData.config.alpha,.77);assert.equal(customData.vision,true);customized.pulse('impact',{x:600,y:700});assert.ok(gm.events.some(e=>e.perception?.refreshVision));gm.context.canvas.ready=false;customized.stop();assert.ok([...gm.local.values()].every(d=>d.hidden));gm.context.canvas.ready=true;await advance(5000);assert.equal(deletes,0);assert.ok([...server.values()].every(d=>d.hidden&&marker(d).key===''));
console.log('Persistent bounded pool, sequential reuse, concurrent slots, stale-lease protection, local-only pulses, delayed clients and configured native fields passed.');

const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 const playerRuntime=(await readFile('dist/weapon-effect-player.js','utf8')).replace(/^export /gm,'');
 await page.addScriptTag({content:playerRuntime+`
 window.checkPulses=(weapon,mode='single',extra={})=>new Promise(resolve=>{const pulses=[];const cancel=playWeaponEffect({weapon,mode,hit:true,visuals:true,sound:false,volume:0,intensity:1,positions:()=>({source:{x:100,y:100},target:{x:600,y:100}}),onLightPulse:(phase,point)=>pulses.push({phase,point}),onDone:()=>resolve(pulses),...extra});window.cancelLightTest=cancel;});`});
 for(const [weapon,mode,count,phase] of [['pistol','single',1,'source'],['smg','auto',5,'source'],['rifle','suppression',8,'source'],['shotgun','single',1,'source'],['grenade','single',1,'impact'],['rocket','single',1,'impact']]){
  const pulses=await page.evaluate(({weapon,mode})=>checkPulses(weapon,mode),{weapon,mode});
  assert.equal(pulses.length,count,weapon+'/'+mode);assert.ok(pulses.every(p=>p.phase===phase));
  assert.ok(pulses.every(p=>phase==='source'?p.point.x<200:p.point.x>500));
 }
 assert.equal((await page.evaluate(()=>checkPulses('rifle','auto',{resumeArea:true}))).length,0,'history recovery does not flash');
 assert.equal((await page.evaluate(()=>checkPulses('pistol','single',{visuals:false}))).length,0,'disabled visuals do not flash');
 await page.addScriptTag({content:`window.checkMovingLight=weapon=>new Promise(resolve=>{const moves=[],pulses=[];playWeaponEffect({weapon,ammo:'smart',hit:true,visuals:true,lightOnly:true,sound:false,volume:0,intensity:1,positions:()=>({source:{x:100,y:100},target:{x:600,y:100}}),onLightMove:point=>moves.push(point),onLightPulse:(phase,point)=>pulses.push({phase,point}),onDone:()=>resolve({moves,pulses})});});`});
 const moving=await page.evaluate(()=>checkMovingLight('rocket'));assert.ok(moving.moves.length>2);assert.ok(moving.moves.at(-1).x>moving.moves[0].x);assert.ok(moving.moves.some(p=>p.y>110),'light follows the smart projectile curve');assert.equal(moving.pulses.length,1);assert.equal(moving.pulses[0].phase,'impact');assert.ok(moving.pulses[0].point.x>550);
 const grenade=await page.evaluate(()=>checkMovingLight('grenade'));assert.equal(grenade.moves.length,0);assert.equal(grenade.pulses.length,1);assert.equal(grenade.pulses[0].phase,'impact','grenades never flash at the attacker');
 for(const [weapon,mode,count,phase] of [['smg','auto',5,'source'],['rifle','suppression',8,'source'],['shotgun','single',1,'source'],['grenade','single',1,'impact'],['rocket','single',1,'impact']]){
  const pulses=await page.evaluate(({weapon,mode})=>checkPulses(weapon,mode,{lightOnly:true}),{weapon,mode});
  assert.equal(pulses.length,count,'unseen '+weapon+' preserves native pulse timing');assert.ok(pulses.every(p=>p.phase===phase));
  assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'light-only playback never attaches artwork');
 }
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal((await page.evaluate(()=>checkPulses('shotgun'))).length,0,'reduced motion suppresses flashes');
 assert.equal((await page.evaluate(()=>checkPulses('shotgun','single',{lightOnly:true}))).length,0,'reduced motion also suppresses unseen flashes');
 console.log('Light controller fixtures and browser shot/impact timing, visible/unseen burst counts, replay and reduced motion passed.');
}finally{await browser.close();}
