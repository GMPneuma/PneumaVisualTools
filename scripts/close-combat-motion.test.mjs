import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const runtime=await readFile(new URL('../dist/weapon-effect-player.js',import.meta.url),'utf8');
const start=runtime.indexOf('function closeStrike('),end=runtime.indexOf('function dataStream(',start);
const render=new Function(runtime.slice(start,end)+';return closeStrike;')();
for(const weapon of ['melee','blade','sword','knife','punch','martial']){
 const armed=['melee','blade','sword','knife'].includes(weapon);
 const family=['sword','knife'].includes(weapon)?'blade':weapon;
 const tip=armed?(weapon==='knife'?43:weapon==='melee'?74:76):14;
 for(const gap of [2,12,30,80,220]){
  let previous=-Infinity,contact;
  for(const progress of [0,.14,.28,.45,.7,1,1.2]){
   const translations=[],scales=[],rotations=[];
   const ctx=new Proxy({globalAlpha:1,translate:(...v)=>translations.push(v),scale:(...v)=>scales.push(v),rotate:v=>rotations.push(v),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});
   render(ctx,family,100,200,100+gap,200,0,progress,1,weapon);
   assert.deepEqual(translations[0],[100,200],'origin stays at attacker edge');
   const anchor=translations[1][0];
   assert.ok(anchor>=previous-1e-9,`${weapon}: no backward translation at gap ${gap}`);
   previous=anchor;
   if(progress===0&&armed){assert.equal(anchor,0);assert.equal(rotations.at(-1),-Math.PI/2);}
   assert.equal(scales[0][0],.8,'artwork stays readable regardless of token gap');
   if(progress===1){contact=anchor;const tipPosition=anchor+tip*scales[0][0];assert.ok(armed?tipPosition>=gap-1e-9:Math.abs(tipPosition-gap)<1e-9,'strike reaches defender');}
   if(progress>1)assert.equal(anchor,contact,'fade stays at contact');
  }
 }
}
console.log('Close-combat motion: attacker origin, forward-only travel, contact alignment and stationary fade passed.');
const whipTip=progress=>{
 const curves=[];
 const ctx=new Proxy({globalAlpha:1,bezierCurveTo:(...points)=>curves.push(points),lineTo:(...points)=>{if(points[0]!==0||points[1]!==0)curves.push(points);}}, {get:(o,k)=>k in o?o[k]:()=>{}});
 render(ctx,'blade',100,200,130,200,0,progress,1,'whip',36);
 return curves.at(-1).slice(-2).map(value=>value===0?0:value);
};
assert.ok(whipTip(.21)[0]>=-24&&whipTip(.21)[0]<0,'compact wind-up stays near attacker');
assert.deepEqual(whipTip(.75),[60,-10.5],'lash reaches narrow waist loop before curling');
assert.ok(whipTip(.9)[0]>60,'curl reaches far side of defender');
assert.ok(whipTip(1)[1]>0,'curl travels under defender');
assert.ok(whipTip(1.25)[0]<whipTip(1)[0],'wrapped lash pulls back toward attacker');
console.log('Whip compact wind-up, extension, wrap and pullback passed.');
