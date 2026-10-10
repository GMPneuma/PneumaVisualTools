import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('../docs/drug-effects-preview.html',import.meta.url).href);
 await page.waitForFunction(()=>!!window.drugPreview);
 await page.selectOption('#drug','boost');await page.selectOption('#mode','screen');
 assert.equal(await page.locator('#pneuma-boost-overlay svg').count(),2);
 assert.ok(await page.evaluate(()=>document.querySelector('#pneuma-boost-overlay').getAnimations({subtree:true}).length===6));
 assert.ok(await page.evaluate(()=>{
  const flow=document.querySelector('[data-boost-flow="0"]'),animation=flow.getAnimations()[0];animation.pause();
  animation.currentTime=100;const a=new DOMMatrix(getComputedStyle(flow).transform).m42;
  animation.currentTime=200;const b=new DOMMatrix(getComputedStyle(flow).transform).m42;
  return b>a;
 }),'exhaust travels down the screen');
 await page.evaluate(()=>{for(const a of document.getAnimations()){a.pause();a.currentTime=3000;}});
 await page.screenshot({path:'docs/boost-jet-preview.png'});
 await page.setViewportSize({width:800,height:1100});
 await page.waitForFunction(()=>document.querySelector('#pneuma-boost-overlay svg').getAttribute('height')==='1100');
 assert.deepEqual(await page.locator('#pneuma-boost-overlay svg').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width)),[200,200]);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>document.getAnimations().length===0);
 assert.equal(await page.locator('#pneuma-boost-overlay svg').count(),2);
 await page.selectOption('#mode','token');
 const token=await page.evaluate(()=>{
  drugPreview.app.ticker.stop();drugPreview.stop();
  const render=()=>{drugPreview.app.renderer.render(drugPreview.app.stage);return drugPreview.app.renderer.extract.pixels();};
  const base=render(),effect=createPatternToken('boost');drugPreview.overlay.addChild(effect.container);
  effect.update(160,160,0,0,false);const a=render();effect.update(160,160,.3,0,false);const b=render();
  effect.update(160,160,0,0,true);const c=render();effect.update(160,160,30,0,true);const d=render();
  let outsideClean=true;for(let i=3;i<base.length;i+=4)if(base[i]===0&&d[i]!==0)outsideClean=false;
  effect.destroy();drugPreview.show();drugPreview.app.ticker.start();
  return {animated:a.some((v,i)=>v!==b[i]),stationary:c.every((v,i)=>v===d[i]),outsideClean};
 });
 assert.deepEqual(token,{animated:true,stationary:true,outsideClean:true});
 await page.screenshot({path:'docs/boost-token-preview.png'});
 await page.click('#stop');assert.equal(await page.locator('[data-pvt-screen-effect-area]').count(),0);
 assert.equal(await page.evaluate(()=>document.getAnimations().length),0);assert.deepEqual(errors,[]);
 console.log('Boost jets: full-height rails, downward animation, fixed-width resize, reduced motion and cleanup passed.');
}finally{await browser.close();}
