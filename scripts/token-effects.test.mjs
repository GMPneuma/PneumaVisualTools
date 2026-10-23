import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {burningStrength} from '../dist/fire-status.js';
const frames=new Map();let frameId=0,checks=0,preview;
const flush=()=>{const work=[...frames.values()];frames.clear();for(const fn of work)fn();};
const hooks={},settings=new Map(),tickers=new Set();let patterns=[],patternCreated=0,patternDestroyed=0,smash=false,smashCreated=0,smashDestroyed=0,poison=true,glass=true,masksCreated=0,masksDestroyed=0;
class Graphics {addChild(){}eventMode='';visible=true;destroyed=false;clear(){}drawRect(){}lineStyle(){}drawRoundedRect(){}drawPolygon(){}beginFill(){}endFill(){}drawCircle(){}moveTo(){}lineTo(){}drawEllipse(){}destroy(){this.destroyed=true;}}
const effect={name:'On Fire (Strong)',statuses:new Set(),disabled:false,isSuppressed:false};
const actor={documentName:'Actor',uuid:'Actor.test',effects:[effect],system:{derivedStats:{humanity:{value:9}}}};
effect.parent=actor;
const token={actor,renderable:true,isVisible:true,w:100,h:100,children:[],addChild(g){this.children.push(g)},removeChild(g){this.children=this.children.filter(c=>c!==g)}};
const canvas={ready:true,tokens:{placeables:[token]},app:{ticker:{add:f=>tickers.add(f),remove:f=>tickers.delete(f)}}};
const media={matches:false,addEventListener:(k,f)=>hooks.motion=f};
const context=vm.createContext({requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),patternKinds:["blackLace","gas","berserker","primeTime","sixgun","timewarp"],PIXI:{Graphics},matchMedia:()=>media,Math,game:{settings:{get:()=>settings.get('tokenEffects').enabled!==false,register:(m,k,v)=>settings.set(k,v)}},canvas,Hooks:{once:(k,f)=>hooks[k]=f,on:(k,f)=>hooks[k]=f},document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},createTokenEffectMask:()=>{masksCreated++;return {destroy(){masksDestroyed++;}};},createTokenPoisonFog:()=>({container:{},update(){},destroy(){}}),createTokenBlueGlassCloud:()=>({container:{},update(){},destroy(){}}),createTokenFireParticles:()=>({container:{},update(){},destroy(){}}),tokenPreview:t=>t===token?preview:undefined,anyTokenPreview:()=>!!preview,actorPatternKinds:()=>{checks++;return patterns;},createPatternToken:()=>{patternCreated++;return {container:{},update(){},destroy(){patternDestroyed++;}};},flashbangState:()=>undefined,hasElectricalShock:()=>false,hasEMP:()=>false,hasSmash:()=>smash,createTokenSmashOverlay:()=>{smashCreated++;return {container:{},update(){},destroy(){smashDestroyed++;}};},hasBlueGlass:()=>glass,hasPoisonExposure:()=>poison,burningStrength,humanityStage:v=>v<10?'cyberpsycho':undefined});
vm.runInContext((await readFile('dist/effect-refresh.js','utf8')).replace(/export /g,''),context);
vm.runInContext((await readFile('dist/token-effects.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'')+'\nregisterTokenEffects();',context);
assert.equal(vm.runInContext('tokenEffectKinds(canvas.tokens.placeables[0].actor).join(",")',context),'poison,blueGlass,fire2');
hooks.ready();flush();assert.equal(token.children.length,1);assert.equal(tickers.size,1);
for(const tick of tickers)tick(1);
hooks.refreshToken(token);assert.equal(token.children.length,1,'refresh does not duplicate overlays');
assert.equal(masksCreated,1,'all concurrent effects share one silhouette filter');
media.matches=true;hooks.motion();flush();assert.equal(tickers.size,0);assert.equal(token.children.length,1);
poison=false;glass=false;effect.disabled=true;
for(const humanity of [29,20,19,10,9,0,-5,40]){actor.system.derivedStats.humanity.value=humanity;hooks.updateActor(actor);flush();assert.equal(token.children.length,0,'Humanity alone must never produce a token overlay');}
effect.disabled=false;effect.name='On Fire (Deadly)';assert.equal(burningStrength(actor),3);hooks.updateActiveEffect(effect);flush();assert.equal(token.children.length,1);
token.isVisible=false;hooks.refreshToken(token);assert.equal(token.children[0].visible,false);
token.isVisible=true;hooks.refreshToken(token);settings.get('tokenEffects').enabled=false;settings.get('tokenEffects').onChange();flush();assert.equal(token.children.length,0);
settings.get('tokenEffects').enabled=true;hooks.canvasReady();flush();assert.equal(token.children.length,1);hooks.canvasTearDown();assert.equal(token.children.length,0);assert.equal(tickers.size,0);
assert.equal(masksDestroyed,masksCreated,'visibility, preferences and teardown release every owned mask');
effect.disabled=true;smash=true;hooks.updateActor(actor);flush();assert.equal(token.children.length,1);assert.equal(smashCreated,1);assert.equal(masksCreated,masksDestroyed+1,'Smash is attached under the shared token alpha mask');smash=false;hooks.updateActor(actor);flush();assert.equal(smashDestroyed,1);assert.equal(token.children.length,0);
let intrusion=true;context.game.modules={get:()=>({active:true,api:{hasNeuralIntrusion:()=>intrusion}})};media.matches=false;hooks.updateCombat();flush();assert.equal(token.children.length,1);for(const tick of tickers)tick(1);intrusion=false;hooks.pneumaCombatToolsNeuralIntrusionChanged();flush();assert.equal(token.children.length,0,'ending the detected connection clears token glitches');
patterns=['blackLace','gas'];hooks.updateItem({parent:actor});flush();assert.equal(token.children.length,1);assert.equal(patternCreated,2);assert.equal(masksCreated,masksDestroyed+1,'remaining token effects share the transparency filter');patterns=[];hooks.updateItem({parent:actor});flush();assert.equal(token.children.length,0);assert.equal(patternDestroyed,2);
console.log('Token shared triggers, fire strengths, rendering lifecycle, visibility and reduced motion passed');

patterns=['berserker','primeTime','sixgun','timewarp'];hooks.updateItem({parent:actor});flush();assert.equal(token.children.length,1);assert.equal(masksCreated,masksDestroyed+1);for(const tick of tickers)tick(1);patterns=[];hooks.updateItem({parent:actor});flush();assert.equal(token.children.length,0);assert.equal(masksCreated,masksDestroyed);

// Refresh storms and animation must never re-evaluate actor conditions.
media.matches=false;patterns=['blackLace'];hooks.updateActor(actor);flush();
let before=checks;
for(let i=0;i<100;i++){hooks.refreshToken(token);for(const tick of tickers)tick(1);}
flush();assert.equal(checks,before,'100 movement frames perform zero condition scans');
hooks.updateToken({object:token},{x:100,y:200,flags:{'pneuma-combattools':{movement:{spent:1}}}});flush();
assert.equal(checks,before,'committed combat movement does not invalidate effects');
for(let i=0;i<30;i++)hooks.updateActor(actor);
assert.equal(frames.size,1);flush();assert.equal(checks,before+1,'actor update burst evaluated once');
const other={...token,actor:{...actor,uuid:'Actor.other'},children:[]};canvas.tokens.placeables.push(other);
hooks.canvasReady();flush();before=checks;hooks.updateActor(actor);flush();
assert.equal(checks,before+1,'unrelated scene actors are not evaluated');
hooks.updateActiveEffect({parent:{documentName:'Item',parent:actor}});flush();assert.equal(checks,before+2,'item-owned effects invalidate their actor');
hooks.updateActor(actor);hooks.canvasTearDown();flush();assert.equal(frames.size,0);assert.equal(tickers.size,0);assert.equal(token.children.length,0);
console.log('Movement storms, animation caching, targeted invalidation, batching and teardown passed');

// Local previews survive a disabled normal-effects preference and clear cleanly.
canvas.tokens.placeables=[token];settings.get('tokenEffects').enabled=false;
preview={kind:'fire2',created:Date.now()};hooks.pneumaVisualToolsPreviewChanged();flush();assert.equal(token.children.length,1);
preview=undefined;hooks.pneumaVisualToolsPreviewChanged();flush();assert.equal(token.children.length,0);assert.equal(tickers.size,0);
settings.get('tokenEffects').enabled=true;patterns=[];effect.disabled=true;hooks.canvasReady();flush();
before=checks;for(let i=0;i<100;i++)hooks.refreshToken(token);flush();assert.equal(checks,before,'effect-free tokens also avoid movement scans');
console.log('Preview preference independence and effect-free movement passed');
