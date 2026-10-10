import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
let observer,resizeObserver,scheduled;const listeners=new Set();
class Element {style={};dataset={};children=[];id='';collapsed=false;classList={contains:()=>this.collapsed};append(node){this.children.push(node);}remove(){this.removed=true;}contains(node){return this===node||this.children.includes(node);}querySelector(){return null;}getBoundingClientRect(){return {left:this.left??900,right:1200,width:1200-(this.left??900)};}}
const body=new Element(),sidebar=new Element();sidebar.id='sidebar';body.append(sidebar);
class ResizeObserver {constructor(fn){this.fn=fn;resizeObserver=this;}observe(node){this.node=node;}disconnect(){this.disconnected=true;}}
class MutationObserver {constructor(fn){this.fn=fn;observer=this;}observe(){}disconnect(){this.disconnected=true;}}
const context=vm.createContext({Element,ResizeObserver,MutationObserver,innerWidth:1200,document:{body,getElementById:()=>sidebar,createElement:()=>new Element()},window:{addEventListener:k=>listeners.add(k),removeEventListener:k=>listeners.delete(k)},requestAnimationFrame:fn=>{scheduled=fn;return 1;},cancelAnimationFrame(){}});
vm.runInContext((await readFile('dist/screen-effect-area.js','utf8')).replace(/export /g,''),context);
const fog=new Element(),particles=new Element();context.fog=fog;context.particles=particles;vm.runInContext('mountScreenEffect(fog,true);mountScreenEffect(particles,false)',context);
assert.equal(body.children[1].style.width,'1010px');assert.match(body.children[1].style.maskImage,/transparent 1010px/);assert.equal(body.children[2].style.width,'900px');assert.equal(body.children[2].style.maskImage,'none');
observer.fn([{type:'attributes',target:body.children[1]}]);assert.equal(scheduled,undefined,'own host layout mutations cannot schedule a feedback loop');
sidebar.collapsed=true;observer.fn([{type:'attributes',target:sidebar}]);scheduled();assert.equal(body.children[1].style.width,'1200px');assert.equal(body.children[1].style.maskImage,'none');assert.equal(body.children[2].style.width,'1200px');
sidebar.collapsed=false;sidebar.left=820;resizeObserver.fn();scheduled();assert.equal(body.children[2].style.width,'820px');assert.equal(body.children[1].style.width,'930px');
vm.runInContext('removeScreenEffect(fog);removeScreenEffect(particles)',context);assert.ok(observer.disconnected&&resizeObserver.disconnected);assert.equal(listeners.size,0);
const emoji=36,wobble=7,rotation=12*Math.PI/180;assert.ok(emoji*(Math.cos(rotation)+Math.sin(rotation))/2+wobble<36,'reserved emoji clearance covers rotation and wobble');
console.log('Sidebar expanded/collapsed/resized bounds, soft fade, observer isolation, cleanup and emoji clearance passed');
