import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const context=vm.createContext({game:{time:{worldTime:20}}});
for(const file of ['substance-effects','remaining-effects']){const code=(await readFile('dist/'+file+'.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/^export /gm,'');vm.runInContext(file==='substance-effects'?'globalThis.hasPrimaryDrug=(()=>{'+code+';return hasPrimaryDrug;})();':code,context);}
const effect={name:'Localized',statuses:new Set(['3i5twkh0722lw1bz']),duration:{},disabled:false};context.actor={uuid:'Actor.test',effects:[effect],items:[]};
const kinds=()=>Array.from(vm.runInContext('actorPatternKinds(actor)',context));
assert.deepEqual(kinds(),['choking1']);effect.statuses.add('8g65kc038fh7av9k');assert.deepEqual(kinds(),['choking2']);
effect.disabled=true;assert.deepEqual(kinds(),[]);effect.disabled=false;effect.isSuppressed=true;assert.deepEqual(kinds(),[]);effect.isSuppressed=false;
effect.duration={seconds:10,startTime:0};assert.deepEqual(kinds(),[]);effect.duration={};context.actor.effects=[];assert.deepEqual(kinds(),[]);
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('../docs/drug-effects-preview.html',import.meta.url).href);await page.waitForFunction(()=>!!window.drugPreview);
 for(const kind of ['radiation','emp','choking1','choking2']){
  await page.selectOption('#drug',kind);assert.equal(await page.locator('#pneuma-'+kind+'-overlay').count(),1);
  if(kind==='emp'){
   assert.ok(await page.evaluate(()=>{
    const cells=[...document.querySelector('[data-emp-cluster]').children];
    const visibleAt=t=>{for(const cell of cells){const a=cell.getAnimations()[0];a.pause();a.currentTime=t;}return cells.filter(n=>Number(getComputedStyle(n).opacity)>.1).length;};
    const entering=visibleAt(1050),full=visibleAt(700+cells.length*140+500),leaving=visibleAt(700+cells.length*140+1800);
    return entering>0&&entering<cells.length&&full===cells.length&&leaving>0&&leaving<full;
   }),'grid builds and clears one square at a time');
   const location=()=>page.locator('[data-emp-readout]').first().evaluate(n=>n.style.top);
   const initial=await location();
   await page.evaluate(()=>{for(const a of document.querySelector('[data-emp-readout]').getAnimations()){a.pause();a.currentTime=6000;}});
   await page.waitForTimeout(550);const next=await location();assert.notEqual(next,initial,'next appearance gets a different position');
   await page.evaluate(()=>{for(const a of document.querySelector('[data-emp-readout]').getAnimations())a.currentTime=36000;});
   await page.waitForTimeout(550);assert.notEqual(await location(),next,'positions change on subsequent cycles too');
   assert.deepEqual(await page.locator('[data-emp-readout] span').allTextContents(),['> Malfunction','> Power Failure','> System Reset','> Signal Lost','> Voltage Drop','> Reinitializing']);
   assert.ok(await page.evaluate(()=>{const text=document.querySelector('[data-emp-readout] span'),a=text.getAnimations()[0];a.pause();a.currentTime=400;const partial=text.getBoundingClientRect().width;a.currentTime=7000;return partial>0&&text.getBoundingClientRect().width>partial;}),'readout reveals characters progressively');
  }
  if(kind==='emp')assert.ok(await page.evaluate(()=>{
   const root=document.querySelector('#pneuma-emp-overlay'),animations=root.getAnimations({subtree:true});
   for(let t=0;t<45000;t+=100){for(const a of animations){a.pause();a.currentTime=t;}if([...root.querySelectorAll('[data-emp-readout]')].filter(n=>Number(getComputedStyle(n).opacity)>0).length>2)return false;}return true;
  }),'at most two readouts throughout repeated cycles');
  await page.evaluate(()=>{for(const a of document.getAnimations()){a.pause();a.currentTime=900;}});
  await page.screenshot({path:'docs/'+kind+'-preview.png'});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.getAnimations().length===0);
 for(const kind of ['radiation','emp','choking1','choking2']){
  await page.selectOption('#drug',kind);
  assert.ok(await page.evaluate(kind=>{drugPreview.app.ticker.stop();const p=kind==='radiation'?createPatternToken(kind):createConditionToken(kind);drugPreview.overlay.addChild(p.container);const render=t=>{p.update(160,160,t,0,true);drugPreview.app.renderer.render(drugPreview.app.stage);return drugPreview.app.renderer.extract.pixels();};const a=render(0),b=render(30);p.destroy();return a.every((v,i)=>v===b[i]);},kind));
 }
 await page.click('#stop');assert.equal(await page.locator('[data-pvt-screen-effect-area]').count(),0);assert.deepEqual(errors,[]);
 console.log('Choking native IDs, precedence, suppression, expiry/removal; EMP/choking previews, reduced motion and cleanup passed.');
}finally{await browser.close();}
