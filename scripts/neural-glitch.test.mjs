import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
const timers=new Map(); let id=0, owner=true, connection=true, cleared=0, ejected=0, eligible="actor", hidden=false;
const nodes=[]; const listeners={}; const motion={matches:false,addEventListener:(k,f)=>listeners.motion=f};
const context=vm.createContext({
 window:{matchMedia:()=>motion},document:{get hidden(){return hidden;},addEventListener:(k,f)=>listeners[k]=f,
 createElement:()=>({style:{},children:[],setAttribute(){},append(child){this.children.push(child);},remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1);}}),body:{append:n=>nodes.push(n)}},
 setTimeout:(f,delay)=>{timers.set(++id,{f,delay});return id;},clearTimeout:i=>timers.delete(i),Math,
 forceOutEntries:()=>connection?[{messageId:"hack",name:"Unknown Netrunner"}]:[],
 clearInstantCondition:async()=>cleared++,beginForceOut:async()=>ejected++,
 game:{messages:{get:()=>({id:"hack"})}},ui:{notifications:{error:e=>{throw e;}}},
 ContextMenu:class{constructor(container,selector,items){context.menu=items;}},$:x=>x
});
vm.runInContext((await readFile("dist/neural-glitch.js","utf8")).replace(/export /g,"")+"\nglobalThis.api={createIntrusionGlitches};",context);
const glitch=context.api.createIntrusionGlitches(()=>eligible);
const run=()=>{const [key,t]=timers.entries().next().value;timers.delete(key);t.f();return t.delay;};
glitch.sync();assert.equal(timers.size,1);const first=[...timers.keys()][0];glitch.sync();assert.equal([...timers.keys()][0],first,"Rerender preserves timer");
assert.equal(run(),1000);assert.equal(nodes.length,1);
function checkRegions() {
 const regions=nodes[0].children;
 assert.ok(regions.length===1||regions.length===2);
 let area=0;
 for(const region of regions) {
  assert.equal(region.className,'pneuma-neural-region');
  const w=parseFloat(region.style.width),h=parseFloat(region.style.height),x=parseFloat(region.style.left),y=parseFloat(region.style.top);
  assert.ok(x>=0&&y>=0&&x+w<=100.00001&&y+h<=100.00001,'Region remains within viewport');
  area+=w*h/10000;
  assert.equal(region.children[0].className,'pneuma-neural-signal');
 }
 assert.ok(area>=.1-1e-8&&area<=.24+1e-8,'Combined region area is limited to 10–24 percent');
}
checkRegions();assert.equal(run(),1800);assert.equal(nodes.length,0);assert.equal(timers.size,1);
for(let i=0;i<50;i++){run();checkRegions();run();}
const repeat=run();assert.ok(repeat>=6000&&repeat<=10000);eligible=undefined;glitch.sync();assert.equal(nodes.length,0);assert.equal(timers.size,0,"Clearing intrusion cancels burst and timer");
eligible="actor";glitch.sync();motion.matches=true;listeners.motion();assert.equal(timers.size,0);
motion.matches=false;listeners.motion();assert.equal(timers.size,1);hidden=true;listeners.visibilitychange();assert.equal(timers.size,0);
hidden=false;listeners.visibilitychange();eligible=undefined;run();assert.equal(nodes.length,0,"Revalidate before delayed burst");
console.log("Visual Tools glitch scheduling, region bounds and cleanup passed");
