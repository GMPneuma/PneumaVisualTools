import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
let pixels,textures=0;const sprites=[];
class Container {addChild(){}destroy(options){this.options=options;}}
class Sprite {constructor(){sprites.push(this);this.anchor={set(){}};this.position={set:(x,y)=>{this.x=x;this.y=y;}};}}
const context=vm.createContext({PIXI:{Container,Sprite,Texture:{from:()=>{textures++;return {destroyed:false};}}},document:{createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:p=>pixels=p.data})})}});
vm.runInContext((await readFile('dist/blue-glass-cloud.js','utf8')).replace(/export /g,'')+'\nconst cloud=createTokenBlueGlassCloud();cloud.update(100,100,0,false);',context);
assert.equal(pixels[3],0,'cloud edge feathers to transparency');assert.ok(pixels[(128*256+128)*4+3]>190,'cloud center has strong coverage');assert.ok(new Set(Array.from(pixels).filter((_,i)=>i%4===0)).size>100,'colors blend continuously');
for(let x=40;x<=90;x+=10)for(let c=0;c<3;c++)assert.ok(Math.abs(pixels[(127*256+x)*4+c]-pixels[(129*256+x)*4+c])<20,'angular wrap must not create a hard radial color seam');
const before=sprites.map(s=>[s.rotation,s.alpha,s.width]);vm.runInContext('cloud.update(100,100,2,false)',context);assert.ok(sprites.every((s,i)=>s.rotation!==before[i][0]));assert.ok((sprites[0].rotation-before[0][0])*(sprites[1].rotation-before[1][0])<0,'clouds counter-rotate');assert.equal(sprites.length,3);
vm.runInContext('cloud.update(100,100,0,true)',context);const still=sprites.map(s=>[s.x,s.y,s.rotation]);vm.runInContext('cloud.update(100,100,99,true)',context);assert.deepEqual(sprites.map(s=>[s.x,s.y,s.rotation]),still);
vm.runInContext('const second=createTokenBlueGlassCloud();cloud.destroy();',context);assert.equal(textures,1);assert.equal(vm.runInContext('cloud.container.options.texture',context),false);
console.log('Blue Glass soft coverage, color blending, counter-rotation, reduced motion and texture reuse passed');
