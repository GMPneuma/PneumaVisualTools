import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const drugs=[['berserker','Berserker','pneuma-berserker'],['primeTime','Prime Time','pneuma-prime-time'],['sixgun','Sixgun','pneuma-sixgun'],['timewarp','Timewarp','pneuma-timewarp']];
const rendererContext=vm.createContext({});
vm.runInContext((await readFile('dist/remaining-renderers.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/^export /gm,''),rendererContext);
for(const [cols,rows] of [[4,22],[4,7]]){
 const cells=vm.runInContext('shieldCells('+cols+','+rows+')',rendererContext);
 assert.equal(cells.length,cols*(rows+1));assert.ok(cells.every(p=>p.length===6));
 const widths=cells.map(p=>Math.abs(p[2]-p[0]));assert.ok(widths.every(w=>Math.abs(w-widths[0])<1e-10),'uniform triangles');
 for(let row=0;row<rows;row++)assert.ok(cells.slice(row*cols,(row+1)*cols).every(p=>p[1]===cells[row*cols][1]),'aligned rows');
 for(let i=0;i<cells.length-cols;i++){
  const a=cells[i],b=cells[i+cols];assert.ok((a[2]-a[0])*(b[2]-b[0])<0,'triangles alternate right/left vertically');
  const vertices=p=>[0,2,4].map(j=>p[j]+','+p[j+1]);assert.equal(vertices(a).filter(v=>vertices(b).includes(v)).length,2,'neighbors share an entire edge');
 }
 assert.equal(new Set(vm.runInContext('shieldOrder('+cells.length*2+')',rendererContext)).size,cells.length*2);
}
const context=vm.createContext({game:{time:{worldTime:20}}});
vm.runInContext((await readFile('dist/substance-effects.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/^export /gm,''),context);
for(const [kind,name,id] of drugs){
 const effect={name,statuses:new Set([id]),duration:{seconds:60,startTime:0},disabled:false};
 context.actor={effects:[effect],items:[]};context.name=name;context.id=id;
 const check=()=>vm.runInContext('hasPrimaryDrug(actor,name,id)',context);
 assert.equal(check(),true,kind+' active marker');effect.disabled=true;assert.equal(check(),false);effect.disabled=false;
 effect.isSuppressed=true;assert.equal(check(),false);effect.isSuppressed=false;
 effect.duration.remaining=0;assert.equal(check(),false);delete effect.duration.remaining;
 effect.duration.startTime=-100;assert.equal(check(),false);effect.duration.startTime=0;
 effect.name=name+' Addiction';assert.equal(check(),false,'addiction cannot activate drug visuals even with stale status');
 effect.name='Localized name';assert.equal(check(),true,'catalog ID works independent of effect name');
 context.actor.effects=[];assert.equal(check(),false,'removal stops visual');
}
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(new URL('../docs/drug-effects-preview.html',import.meta.url).href);await page.waitForFunction(()=>!!window.drugPreview);
 for(const [kind] of drugs){
  await page.selectOption('#drug',kind);
  assert.equal(await page.locator('#pneuma-'+kind+'-overlay svg').count(),kind==='primeTime'?2:12);
  if(kind==='primeTime'){assert.equal(await page.locator('#pneuma-primeTime-overlay path[fill^=url]').count(),8*(Math.ceil(760/35)+1));assert.ok(await page.locator('#pneuma-primeTime-overlay path').first().getAttribute('d').then(d=>d.includes(' Q ')));}
  assert.equal(await page.evaluate(()=>drugPreview.overlay.children.length),2,'one mask and one renderer, no accumulation');
  await page.evaluate(()=>{for(const a of document.getAnimations()){a.pause();a.currentTime=1800;}});
  if(kind==='primeTime'){
   const counts=await page.evaluate(()=>Array.from(document.querySelectorAll('#pneuma-primeTime-overlay svg')).map(svg=>Array.from(svg.querySelectorAll('path')).filter(path=>{
    const a=path.getAnimations()[0];if(!a)return false;
    const timing=a.effect.getTiming(),age=(a.currentTime-timing.delay)%timing.duration;
    return age>=0&&age<4800;
   }).length));
   assert.deepEqual(counts,[4,4],'four independently fading highlights on each side');
   const geometry=()=>page.evaluate(()=>{const p=document.querySelector('#pneuma-primeTime-overlay path'),b=p.getBBox(),m=p.getScreenCTM();return [b.width*m.a,b.height*m.d];});
   const before=await geometry();
   await page.setViewportSize({width:700,height:1000});
   await page.waitForFunction(()=>document.querySelector('#pneuma-primeTime-overlay svg').getAttribute('height')==='1015');
   const after=await geometry();after.forEach((v,i)=>assert.ok(Math.abs(v-before[i])<.001,'triangle geometry remains fixed on resize'));
   await page.setViewportSize({width:1100,height:760});
   await page.waitForFunction(()=>document.querySelector('#pneuma-primeTime-overlay svg').getAttribute('height')==='770');
  }
  await page.screenshot({path:'docs/'+kind+'-preview.png'});
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [kind] of drugs){
  await page.selectOption('#drug',kind);await page.waitForFunction(()=>document.getAnimations().length===0);
  const stable=await page.evaluate(()=>{
   drugPreview.app.ticker.stop();const kind=document.getElementById('drug').value,p=createPatternToken(kind);drugPreview.overlay.addChild(p.container);
   const render=t=>{p.update(160,160,t,0,true);drugPreview.app.renderer.render(drugPreview.app.stage);return drugPreview.app.renderer.extract.pixels();};
   const a=render(0),b=render(30);p.destroy();return a.every((v,i)=>v===b[i]);
  });assert.ok(stable,'reduced motion token ignores time');
 }
 await page.click('#stop');assert.equal(await page.locator('[data-pvt-screen-effect-area]').count(),0);assert.equal(await page.evaluate(()=>drugPreview.overlay.children.length),1,'only shared mask remains after stop');
 assert.deepEqual(errors,[]);
 console.log('Four drug status activation, suppression/expiry/removal, screen and masked token preview, stationary reduced motion and cleanup passed.');
}finally{await browser.close();}
