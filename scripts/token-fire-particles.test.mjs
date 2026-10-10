import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const sprites=[];let textures=0;
class Container {children=[];addChild(s){this.children.push(s);}destroy(options){this.options=options;}}
class Sprite {constructor(texture){this.texture=texture;this.anchor={set(){}};this.position={set:(x,y)=>{this.x=x;this.y=y;}};sprites.push(this);}}
const context=vm.createContext({PIXI:{Container,Sprite,Texture:{WHITE:{},from:()=>{textures++;return {destroyed:false};}}},document:{createElement:()=>({getContext:()=>({scale(){},createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})}});
vm.runInContext((await readFile('dist/token-fire-particles.js','utf8')).replace(/export /g,'')+'\nconst fire=createTokenFireParticles();fire.update(100,100,0,1,false);',context);
assert.equal(sprites.filter(s=>s.visible).length,24);
const before=sprites.map(s=>[s.x,s.y,s.alpha]);vm.runInContext('fire.update(100,100,.2,3,false)',context);assert.equal(sprites.filter(s=>s.visible).length,72);assert.ok(sprites.some((s,i)=>s.y!==before[i][1]));assert.ok(sprites.every(s=>s.alpha>=0&&s.alpha<=1));
const pool=sprites.length;vm.runInContext('for(let i=0;i<100;i++)fire.update(100,100,i*.05,3,false)',context);assert.equal(sprites.length,pool,'fixed pool prevents per-frame allocations');
vm.runInContext('fire.update(100,100,0,2,true)',context);const still=sprites.map(s=>[s.x,s.y,s.alpha]);vm.runInContext('fire.update(100,100,99,2,true)',context);assert.deepEqual(sprites.map(s=>[s.x,s.y,s.alpha]),still);
vm.runInContext('const second=createTokenFireParticles();fire.destroy();',context);assert.equal(textures,1);assert.equal(vm.runInContext('fire.container.options.texture',context),false);
console.log('Procedural fire particle strength, motion, fixed pool, reduced motion and shared texture cleanup passed');
