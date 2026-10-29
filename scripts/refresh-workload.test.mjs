import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {tokenEffectKinds} from '../dist/token-effects.js';
import {actorRefreshCandidates,combatVisualsChanged} from '../dist/effect-refresh.js';

test('all token drug checks share one inventory traversal and honor edits and expiry',()=>{
 globalThis.game={time:{worldTime:0},modules:new Map(),i18n:{localize:s=>s}};
 let inventories=0,native=0;
 const effect={name:'Blue Glass',statuses:new Set(),duration:{seconds:60,startTime:0},disabled:false};
 const items=Array.from({length:1000},()=>({effects:[]}));items[999].effects=[effect];
 const actor={uuid:'Actor.a',effects:[],allApplicableEffects(){native++;return [];},items:{*[Symbol.iterator](){inventories++;yield* items;}}};
 assert.deepEqual(tokenEffectKinds(actor),['blueGlass']);assert.equal(inventories,1);assert.equal(native,1);
 effect.disabled=true;assert.deepEqual(tokenEffectKinds(actor),[]);
 effect.disabled=false;game.time.worldTime=60;assert.deepEqual(tokenEffectKinds(actor),[]);
 game.time.worldTime=0;assert.deepEqual(tokenEffectKinds(actor),['blueGlass']);
 items[999].effects=[];assert.deepEqual(tokenEffectKinds(actor),[]);
});

test('clock hydration visits condition sources rather than every scene actor',()=>{
 let scans=0;
 const actors=Array.from({length:100},(_,i)=>({uuid:'Actor.'+i,effects:[],items:[],allApplicableEffects(){scans++;return this.effects;}}));
 actors[0].effects=[{name:'Poisoned'}];
 globalThis.canvas={tokens:{placeables:actors.map(actor=>({actor}))}};
 const candidates=actorRefreshCandidates();assert.equal(candidates.take().size,100);scans=0;
 for(let i=0;i<100;i++){candidates.time();assert.equal(candidates.take().size,1);}
 assert.equal(scans,100,'100 clock events scan one affected actor each, not all 100');
 actors[1].effects=[{}];candidates.mark(actors[1]);candidates.take();candidates.time();assert.equal(candidates.take().size,2);
 candidates.clear();canvas.tokens.placeables=[];assert.equal(candidates.take().size,0);candidates.time();assert.equal(candidates.take().size,0);
 for(const change of [{turn:1},{round:2},{name:'rename'},{'flags.pneuma-combattools.movement':{}},{flags:{other:{count:1}}}])assert.equal(combatVisualsChanged(change),false);
 for(const change of [{active:false},{'flags.pneuma-combattools.flashbangVisuals.id':{}},{flags:{'pneuma-combattools':{'-=flashbangVisuals':null}}}])assert.equal(combatVisualsChanged(change),true);
});

test('area panning reuses the mask while zoom and footprint changes rebuild it',async()=>{
 let reads=0;const draws=[];
 const context2d=()=>({globalAlpha:1,fill(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},putImageData(){},clearRect(){},fillRect(){},drawImage(){},createRadialGradient:()=>({addColorStop(){}}),getImageData(_x,_y,w,h){reads++;return {data:new Uint8ClampedArray(w*h*4).fill(255)};}});
 const sandbox=vm.createContext({document:{createElement:()=>({width:0,height:0,getContext:()=>context2d()})},Math,Float32Array});
 vm.runInContext((await readFile('dist/weapon-effect-player.js','utf8')).replace(/^export /gm,''),sandbox);
 const draw=vm.runInContext('createAreaBurst()',sandbox),ctx={globalAlpha:1,save(){},restore(){},drawImage(...args){draws.push(args);}};
 const cells=(dx,dy,size=60)=>[[{x:dx,y:dy},{x:dx+size,y:dy},{x:dx+size,y:dy+size},{x:dx,y:dy+size}]];
 draw(ctx,cells(.1,.2),'teargas',.3,false);
 for(let i=1;i<=100;i++)draw(ctx,cells(.1+i*.137,.2-i*.123),'teargas',.3,false);
 assert.equal(reads,1);assert.ok(Math.abs(draws.at(-1)[1]-11.8)<1e-8);assert.ok(Math.abs(draws.at(-1)[2]+14.1)<1e-8);
 draw(ctx,cells(0,0,120),'teargas',.3,false);assert.equal(reads,2);
 const shape=cells(0,0,120);shape[0][2].x=110;draw(ctx,shape,'teargas',.3,false);assert.equal(reads,3);
});
