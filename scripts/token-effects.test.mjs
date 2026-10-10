import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {burningStrength} from '../dist/fire-status.js';
const hooks={},settings=new Map(),tickers=new Set();let patterns=[],patternCreated=0,patternDestroyed=0,smash=false,smashCreated=0,smashDestroyed=0,poison=true,glass=true,masksCreated=0,masksDestroyed=0;
class Graphics {addChild(){}eventMode='';visible=true;destroyed=false;clear(){}drawRect(){}lineStyle(){}drawRoundedRect(){}drawPolygon(){}beginFill(){}endFill(){}drawCircle(){}moveTo(){}lineTo(){}drawEllipse(){}destroy(){this.destroyed=true;}}
const effect={name:'On Fire (Strong)',statuses:new Set(),disabled:false,isSuppressed:false};
const actor={uuid:'Actor.test',effects:[effect],system:{derivedStats:{humanity:{value:9}}}};
const token={actor,isVisible:true,w:100,h:100,children:[],addChild(g){this.children.push(g)},removeChild(g){this.children=this.children.filter(c=>c!==g)}};
const canvas={ready:true,tokens:{placeables:[token]},app:{ticker:{add:f=>tickers.add(f),remove:f=>tickers.delete(f)}}};
const media={matches:false,addEventListener:(k,f)=>hooks.motion=f};
const context=vm.createContext({PIXI:{Graphics},matchMedia:()=>media,Math,game:{settings:{get:()=>settings.get('tokenEffects').enabled!==false,register:(m,k,v)=>settings.set(k,v)}},canvas,Hooks:{once:(k,f)=>hooks[k]=f,on:(k,f)=>hooks[k]=f},document:{hidden:false,addEventListener(){}},window:{addEventListener(){}},createTokenEffectMask:()=>{masksCreated++;return {destroy(){masksDestroyed++;}};},createTokenPoisonFog:()=>({container:{},update(){},destroy(){}}),createTokenBlueGlassCloud:()=>({container:{},update(){},destroy(){}}),createTokenFireParticles:()=>({container:{},update(){},destroy(){}}),tokenPreview:()=>undefined,anyTokenPreview:()=>false,actorPatternKinds:()=>patterns,createPatternToken:()=>{patternCreated++;return {container:{},update(){},destroy(){patternDestroyed++;}};},flashbangState:()=>undefined,hasElectricalShock:()=>false,hasEMP:()=>false,hasSmash:()=>smash,createTokenSmashOverlay:()=>{smashCreated++;return {container:{},update(){},destroy(){smashDestroyed++;}};},hasBlueGlass:()=>glass,hasPoisonExposure:()=>poison,burningStrength,humanityStage:v=>v<10?'cyberpsycho':undefined});
vm.runInContext((await readFile('dist/token-effects.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'')+'\nregisterTokenEffects();',context);
assert.equal(vm.runInContext('tokenEffectKinds(canvas.tokens.placeables[0].actor).join(",")',context),'poison,blueGlass,fire2');
hooks.ready();assert.equal(token.children.length,1);assert.equal(tickers.size,1);
for(const tick of tickers)tick(1);
hooks.refreshToken();assert.equal(token.children.length,1,'refresh does not duplicate overlays');
assert.equal(masksCreated,1,'all concurrent effects share one silhouette filter');
media.matches=true;hooks.motion();assert.equal(tickers.size,0);assert.equal(token.children.length,1);
poison=false;glass=false;effect.disabled=true;
for(const humanity of [29,20,19,10,9,0,-5,40]){actor.system.derivedStats.humanity.value=humanity;hooks.updateActor();assert.equal(token.children.length,0,'Humanity alone must never produce a token overlay');}
effect.disabled=false;effect.name='On Fire (Deadly)';assert.equal(burningStrength(actor),3);hooks.updateActiveEffect();assert.equal(token.children.length,1);
token.isVisible=false;hooks.refreshToken();assert.equal(token.children.length,0);
token.isVisible=true;hooks.refreshToken();settings.get('tokenEffects').enabled=false;settings.get('tokenEffects').onChange();assert.equal(token.children.length,0);
settings.get('tokenEffects').enabled=true;hooks.canvasReady();assert.equal(token.children.length,1);hooks.canvasTearDown();assert.equal(token.children.length,0);assert.equal(tickers.size,0);
assert.equal(masksDestroyed,masksCreated,'visibility, preferences and teardown release every owned mask');
effect.disabled=true;smash=true;hooks.updateActor();assert.equal(token.children.length,1);assert.equal(smashCreated,1);assert.equal(masksCreated,masksDestroyed+1,'Smash is attached under the shared token alpha mask');smash=false;hooks.updateActor();assert.equal(smashDestroyed,1);assert.equal(token.children.length,0);
let intrusion=true;context.game.modules={get:()=>({active:true,api:{hasNeuralIntrusion:()=>intrusion}})};media.matches=false;hooks.updateCombat();assert.equal(token.children.length,1);for(const tick of tickers)tick(1);intrusion=false;hooks.pneumaCombatToolsNeuralIntrusionChanged();assert.equal(token.children.length,0,'ending the detected connection clears token glitches');
patterns=['blackLace','gas'];hooks.updateItem();assert.equal(token.children.length,1);assert.equal(patternCreated,2);assert.equal(masksCreated,masksDestroyed+1,'remaining token effects share the transparency filter');patterns=[];hooks.updateItem();assert.equal(token.children.length,0);assert.equal(patternDestroyed,2);
console.log('Token shared triggers, fire strengths, rendering lifecycle, visibility and reduced motion passed');

patterns=['berserker','primeTime','sixgun','timewarp'];hooks.updateItem();assert.equal(token.children.length,1);assert.equal(masksCreated,masksDestroyed+1);for(const tick of tickers)tick(1);patterns=[];hooks.updateItem();assert.equal(token.children.length,0);assert.equal(masksCreated,masksDestroyed);
