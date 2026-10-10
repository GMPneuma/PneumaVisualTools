import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('../docs/drug-effects-preview.html',import.meta.url).href);await page.waitForFunction(()=>!!window.drugPreview);
 await page.selectOption('#drug','blackLace');
 assert.equal(await page.locator('#pneuma-blackLace-overlay [data-lace-fabric]').count(),2);
 assert.equal(await page.locator('#pneuma-blackLace-overlay filter').count(),0,'no expensive SVG filters');
 assert.ok(await page.locator('#pneuma-blackLace-overlay path').count()<=24,'bounded simple screen motif');
 assert.equal(await page.evaluate(()=>document.querySelector('#pneuma-blackLace-overlay').getAnimations({subtree:true}).length),2);
 const coverage=await page.evaluate(async()=>{
  const image=laceTile();if(image!==laceTile())throw Error('Lace tile was regenerated');
  const c=document.createElement('canvas');c.width=340;c.height=192;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,340,192).data;
  const count=(start,end)=>{let dark=0;for(let y=0;y<192;y++)for(let x=start;x<end;x++)if(pixels[(y*340+x)*4+3]>80)dark++;return dark/((end-start)*192);};
  let solid=0,feather=0,holes=0;for(let y=0;y<192;y++)for(let x=0;x<64;x++){const i=(y*340+x)*4,a=pixels[i+3];if(a===255&&pixels[i]===0&&pixels[i+1]===0&&pixels[i+2]===0)solid++;if(a>0&&a<255)feather++;if(a===0)holes++;}
  return {outer:count(0,64),inner:count(260,324),solid,feather,holes};
 });
 assert.ok(coverage.outer>.08,'floral embroidery is visible');
 assert.ok(coverage.outer<.98,'open holes remain between thick strands');
 assert.ok(coverage.solid>100&&coverage.feather>100&&coverage.holes>0,'opaque pure black cores feather into transparent holes');
 await page.screenshot({path:'docs/black-lace-preview.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.getAnimations().length===0);
 const result=await page.evaluate(()=>{
  drugPreview.app.ticker.stop();drugPreview.stop();
  const render=()=>{drugPreview.app.renderer.render(drugPreview.app.stage);return drugPreview.app.renderer.extract.pixels();};
  const base=render(),p=createPatternToken('blackLace');drugPreview.overlay.addChild(p.container);
  p.update(160,160,0,0,true);const a=render();
  const fabric=p.container.children[0],texture=fabric.texture;if(!(fabric instanceof PIXI.TilingSprite))throw Error('Expected one tiled sprite');
  p.update(160,160,30,0,true);const b=render();
  p.update(160,160,1,0,false);const c=render();let clipped=true,darkened=false,clear=false,brightened=false;
  for(let i=0;i<base.length;i+=4){if(base[i+3]===0&&a[i+3]!==0)clipped=false;if(base[i+3]===255){if(a[i]<base[i]-2)darkened=true;if(a[i]===base[i]&&a[i+1]===base[i+1])clear=true;if(a[i]>base[i]+1)brightened=true;}}
  const second=createPatternToken('blackLace');if(fabric.texture!==texture||second.container.children[0].texture!==texture)throw Error('Token texture not cached');second.destroy();if(fabric.alpha>.25)throw Error('Token overlay too opaque');
  p.destroy();return {clipped,darkened,clear,brightened,stationary:a.every((v,i)=>v===b[i]),animated:a.some((v,i)=>v!==c[i])};
 });
 assert.deepEqual(result,{clipped:true,darkened:true,clear:true,brightened:false,stationary:true,animated:false});
 await page.click('#stop');assert.equal(await page.locator('[data-pvt-screen-effect-area]').count(),0);assert.deepEqual(errors,[]);
 console.log('Black Lace: dark threads, clear gaps, token mask, movement, reduced motion and cleanup passed.');
}finally{await browser.close();}
