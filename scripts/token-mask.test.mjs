import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:400,height:400}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent('<style>body{margin:0;background:#26323a}</style>');
 await page.addScriptTag({path:'node_modules/.pnpm/pixi.js@7.4.3/node_modules/pixi.js/dist/pixi.min.js'});
 const code=(await readFile('dist/token-effect-mask.js','utf8')).replace(/^export /gm,'');
 await page.addScriptTag({content:code+'\nwindow.makeMask=createTokenEffectMask;'});
 const results=await page.evaluate(()=>{
  const app=new PIXI.Application({width:320,height:320,backgroundAlpha:0,resolution:1,antialias:false,preserveDrawingBuffer:true});
  app.ticker.stop();document.body.appendChild(app.view);
  const primary=new PIXI.Container(),tokens=new PIXI.Container();app.stage.addChild(primary,tokens);
  const art=document.createElement('canvas');art.width=art.height=100;
  const ctx=art.getContext('2d');
  // Black opaque art must mask exactly as bright art; preserve holes/soft alpha.
  ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(15,20);ctx.lineTo(85,20);ctx.lineTo(50,90);ctx.closePath();ctx.fill();
  ctx.clearRect(40,40,20,20);ctx.clearRect(45,23,10,8);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(45,23,10,8);
  const original=PIXI.Texture.from(art),mesh=new PIXI.Sprite(original);mesh.anchor.set(.5);mesh.position.set(140,140);primary.addChild(mesh);
  const layer=new PIXI.Graphics();layer.beginFill(0xffffff);layer.drawRect(0,0,320,320);layer.endFill();tokens.addChild(layer);
  const token={mesh},mask=window.makeMask(token,layer),sprite=layer.children[0];
  const capture=()=>{app.renderer.render(app.stage);return app.renderer.extract.pixels();};
  function compare(label) {
   layer.visible=false;mesh.renderable=true;const expected=capture();
   layer.visible=true;mesh.renderable=false;const actual=capture();
   let bad=0,opaque=0,soft=0,bright=0;
   for(let i=0;i<actual.length;i+=4){
    const alpha=expected[i+3];if(Math.abs(alpha-actual[i+3])>3)bad++;
    if(alpha>250){opaque++;if(actual[i]>250)bright++;}
    if(alpha>20&&alpha<230)soft++;
   }
   return {label,bad,opaque,soft,bright,shared:sprite.texture===mesh.texture};
  }
  const checks=[compare('black artwork, holes and partial alpha')];
  mesh.rotation=.47;mesh.scale.set(-1.25,.8);mesh.anchor.set(.3,.7);mesh.position.set(170,135);
  checks.push(compare('rotation, mirrored/nonuniform scale, anchor and movement'));
  primary.scale.set(.8);tokens.scale.set(.8);primary.position.set(20,30);tokens.position.set(20,30);
  checks.push(compare('canvas pan and zoom'));
  const replacement=document.createElement('canvas');replacement.width=replacement.height=100;
  const next=replacement.getContext('2d');next.fillStyle='#000';next.beginPath();next.arc(50,50,35,0,Math.PI*2);next.fill();
  const replacementTexture=PIXI.Texture.from(replacement);mesh.texture=replacementTexture;
  checks.push(compare('live texture replacement'));
  const pending=new PIXI.Texture(new PIXI.BaseTexture());mesh.texture=pending;
  const blank=capture();const unloadedPixels=blank.filter((value,i)=>i%4===3&&value>0).length;
  mesh.texture=replacementTexture;compare('valid artwork returns');
  mask.destroy();const cleanup={filters:layer.filters,children:layer.children.length,spriteDestroyed:sprite.destroyed,originalValid:original.valid,replacementValid:replacementTexture.valid};
  const gl=app.renderer.gl;const glError=gl.getError();
  window.maskPreview={app,layer,mesh};
  return {checks,unloadedPixels,cleanup,glError};
 });
 for(const check of results.checks){
  assert.ok(check.opaque>100,check.label+' has opaque artwork');
  assert.equal(check.bad,0,check.label+' matches the artwork alpha');
  assert.equal(check.bright,check.opaque,check.label+' does not darken the effect over black artwork');
  assert.equal(check.shared,true,check.label+' borrows the existing texture');
 }
 assert.ok(results.checks[0].soft>0,'soft transparency is represented');
 assert.equal(results.unloadedPixels,0,'missing artwork suppresses the whole overlay');
 assert.deepEqual(results.cleanup,{filters:null,children:0,spriteDestroyed:true,originalValid:true,replacementValid:true});
 assert.equal(results.glError,0,'shader compiled and rendered without a WebGL error');
 assert.deepEqual(errors,[]);
 console.log('Real Pixi/WebGL alpha masking, dark art, transparency, rotation, mirroring, anchor, movement, pan/zoom, texture replacement and borrowed-resource cleanup passed');
} finally {await browser.close();}
