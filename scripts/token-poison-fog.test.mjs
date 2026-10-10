import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
let textures=0;const sprites=[];
class Container {children=[];addChild(child){this.children.push(child);}destroy(options){this.options=options;}}
class Graphics extends Container {clear(){this.clears=(this.clears??0)+1;}beginFill(){}drawRoundedRect(){}endFill(){}}
class Sprite {constructor(texture){this.texture=texture;this.anchor={set(){}};this.position={set:(x,y)=>{this.x=x;this.y=y;}};sprites.push(this);}}
const context=vm.createContext({PIXI:{Container,Graphics,Sprite,Texture:{from:()=>{textures++;return {destroyed:false};}}},document:{createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})}});
vm.runInContext((await readFile('dist/token-poison-fog.js','utf8')).replace(/export /g,'')+'\nconst fog=createTokenPoisonFog();fog.update(100,100,0,1,false);',context);
const before=sprites.map(s=>s.alpha);
vm.runInContext('fog.update(100,100,3,1,false)',context);
assert.ok(sprites.some((s,i)=>Math.abs(s.alpha-before[i])>.05),'fog density varies over time');
assert.ok(new Set(sprites.map(s=>s.alpha.toFixed(3))).size>1,'cloud areas pulse independently');
assert.ok(sprites.every(s=>s.x>0&&s.x<100&&s.y>0&&s.y<100),'cloud anchors remain within token');
assert.equal(vm.runInContext('fog.container.mask.clears',context),1,'unchanged mask bounds are not redrawn every frame');
vm.runInContext('fog.update(120,100,3,1,false)',context);
assert.equal(vm.runInContext('fog.container.mask.clears',context),2,'token resize refreshes mask bounds');
vm.runInContext('fog.update(100,100,3,1,true)',context);const still=sprites.map(s=>[s.alpha,s.x,s.y]);
vm.runInContext('fog.update(100,100,3,1,true)',context);assert.deepEqual(sprites.map(s=>[s.alpha,s.x,s.y]),still);
vm.runInContext('const second=createTokenPoisonFog();fog.destroy();second.update(100,100,0,0,true);',context);
assert.equal(textures,1,'cloud texture is reused across tokens and frames');
assert.equal(vm.runInContext('fog.container.options.texture',context),false,'cleanup preserves shared texture');
console.log('Poison fog density, local anchors, texture reuse and cleanup passed');
