import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const nodes=[],animations=[],faces=[],timers=new Map();let serial=0;
class Node {
 style={};children=[];setAttribute(){}append(child){this.children.push(child);}remove(){this.removed=true;}
 animate(frames,options){const animation={frames,options,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}
 getAnimations(){return animations;}
}
class Container extends Node {addChild(child){this.append(child);}destroy(){this.destroyed=true;}}
class Graphics extends Container {clear(){}lineStyle(){}drawCircle(){}beginFill(){}endFill(){}drawPolygon(){}}
class Text {constructor(text){this.text=text;this.anchor={set(){}};this.position={set:(x,y)=>{this.x=x;this.y=y;}};faces.push(this);}}
const media={matches:false,addEventListener:(type,fn)=>media.change=fn};
const body=new Node();
const context=vm.createContext({mountScreenEffect:layer=>body.append(layer),removeScreenEffect:layer=>layer?.remove(),setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),PIXI:{Container,Text,Graphics},document:{hidden:false,body,createElement:()=>{const node=new Node();nodes.push(node);return node;}},matchMedia:()=>media});
vm.runInContext((await readFile('dist/smash-overlay.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'')+'\nconst screen=createSmashScreenOverlay();screen.start();',context);
assert.equal(body.children.length,1);const layer=body.children[0];assert.equal(layer.children.length,2);
for(const rail of layer.children){assert.equal(rail.style.overflow,'visible');assert.equal(rail.style.width,'clamp(160px, 24cqw, 220px)');assert.ok(rail.style.left==='0'||rail.style.right==='0');assert.equal(rail.children.filter(child=>child.style.fontFamily).length,6);assert.equal(rail.children.filter(child=>child.style.borderRadius==='50%').length,4);}
assert.ok(animations.some(a=>a.frames.at(-1).transform==='translate(-50%, calc(-100vh - 70px))'),'faces travel up the full screen');
const burst=[...timers.values()][0];assert.equal(burst.ms,6000);timers.clear();burst.fn();assert.equal(layer.children[0].children.length,46,'36 confetti pieces join smileys and bubbles on each side');assert.ok(animations.some(a=>a.frames.at(-1).transform?.includes('100vh + 28px')),'confetti falls through the full screen height');assert.ok([...timers.values()][0].ms>=14000,'confetti bursts remain occasional');const confetti=animations.filter(a=>a.frames[0].left==='50%');
assert.equal(confetti.length,72);
for(const batch of [confetti.slice(0,36),confetti.slice(36)]){
 const positions=batch.map(a=>parseFloat(a.frames[1].left));
 assert.ok(Math.min(...positions)<8&&Math.max(...positions)>92,'burst covers most of each smiley rail');
 assert.ok(batch.every(a=>a.frames[1].offset===.1),'spread completes near the top, before the long fall');
 assert.ok(batch.every(a=>a.frames.slice(1).every(f=>parseFloat(f.left)>=4&&parseFloat(f.left)<=96)),'fall stays within its side rail');
}
confetti[0].onfinish();assert.ok(layer.children[0].children[10].removed,'finished confetti is removed');
vm.runInContext('screen.stop()',context);assert.equal(timers.size,0);assert.ok(layer.removed);assert.ok(animations.every(a=>a.cancelled));
const count=animations.length;media.matches=true;vm.runInContext('screen.start()',context);assert.equal(animations.length,count,'reduced motion creates no animations');
vm.runInContext('const token=createTokenSmashOverlay();token.update(100,100,0,0,false);',context);assert.equal(faces.length,3,'token has only three smileys');assert.equal(vm.runInContext('token.container.children.length',context),3,'no token bubbles or confetti');const initial=faces.map(face=>face.y);
vm.runInContext('token.update(100,100,.2,0,false)',context);assert.ok(faces.every((face,i)=>face.y<initial[i]),'token smileys float upward');
vm.runInContext('token.update(100,100,0,0,true)',context);const still=faces.map(face=>[face.x,face.y,face.rotation]);vm.runInContext('token.update(100,100,20,0,true)',context);assert.deepEqual(faces.map(face=>[face.x,face.y,face.rotation]),still);
vm.runInContext('token.destroy()',context);assert.equal(vm.runInContext('token.container.destroyed',context),true);
console.log('Smash side confinement, upward motion, cleanup and reduced motion passed');
