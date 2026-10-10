import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const runtime=(await readFile(new URL('../dist/weapon-effect-player.js',import.meta.url),'utf8')).replace(/^export /gm,'');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1000,height:650}});
 await page.setContent('<style>body{margin:0;background:#101e26}canvas{display:block}</style><canvas width="1000" height="650"></canvas>');
 await page.addScriptTag({content:runtime});
 const checks=await page.evaluate(()=>{
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),families=['gun','shotgun','rocket','arrow','grenade'];
  ctx.fillStyle='#101e26';ctx.fillRect(0,0,1000,650);ctx.fillStyle='#e5eff1';ctx.font='20px system-ui';ctx.fillText('Projectile materials and ammo outlines (3× detail)',24,35);
  const colors=Object.values(profiles).map(p=>p.color);
  families.forEach((f,row)=>{
   ctx.fillStyle='#a1b6c0';ctx.font='14px system-ui';ctx.fillText(f,20,95+row*95);
   colors.forEach((color,col)=>{ctx.save();ctx.translate(255+col*140,90+row*95);ctx.scale(3,3);projectile(ctx,f,0,0,0,color);ctx.restore();});
  });
  muzzleFlash(ctx,120,590,65,1,0);ctx.fillStyle='#a1b6c0';ctx.fillText('Natural muzzle flash',220,595);
  const sample=document.createElement('canvas');sample.width=120;sample.height=60;const c=sample.getContext('2d');
  return families.map(f=>{
   const hashes=colors.map(color=>{c.clearRect(0,0,120,60);projectile(c,f,90,30,0,color);const data=c.getImageData(0,0,120,60).data;return {pixels:data.filter((v,i)=>i%4===3&&v>0).length,hash:data.reduce((h,v)=>Math.imul(h,31)+v|0,0)};});const body=document.createElement('canvas'),withGlow=document.createElement('canvas');body.width=withGlow.width=96;body.height=withGlow.height=48;
   projectileBody(body.getContext('2d'),f,80,24,0,'#74f4b1');projectile(withGlow.getContext('2d'),f,80,24,0,'#74f4b1');
   const bare=body.getContext('2d').getImageData(0,0,96,48).data,halo=withGlow.getContext('2d').getImageData(0,0,96,48).data;
   let clearInterior=true,outerGlow=false;for(let i=0;i<bare.length;i+=4){if(bare[i+3]===255)for(let j=0;j<3;j++)if(Math.abs(bare[i+j]-halo[i+j])>1)clearInterior=false;if(bare[i+3]===0&&halo[i+3]>0)outerGlow=true;}return {f,hashes,clearInterior,outerGlow};
  });
 });
 for(const {f,hashes,clearInterior,outerGlow} of checks){assert.ok(clearInterior,f+' glow leaves opaque body pixels unchanged');assert.ok(outerGlow,f+' glow visible outside silhouette');assert.ok(hashes.every(h=>h.pixels>20),f+' visible shape');assert.equal(new Set(hashes.map(h=>h.hash)).size,6,f+' ammo outlines differ');}
 await page.screenshot({path:'docs/projectile-details-preview.png'});
 console.log('All projectile families render with six distinct ammo outlines.');
}finally{await browser.close();}
