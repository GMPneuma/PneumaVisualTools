import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.PNEUMA_SHARP_MODULE||'sharp');
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const jobs=JSON.parse(await fs.readFile('docs/weapon-art-generation.json','utf8'));
let bytes=0;const tiles=[];
for(const job of jobs){
 const buf=await fs.readFile('src/'+job.file);bytes+=buf.length;
 const m=await sharp(buf).metadata();assert.equal(m.width,512);assert.equal(m.height,256);assert.ok(m.hasAlpha);
 const alpha=await sharp(buf).extractChannel('alpha').raw().toBuffer();
 const count=alpha.filter(v=>v>128).length;assert.ok(count>1000 && count<512*256*.85,job.file+' must contain a visible silhouette and transparent space');
 const uri='data:image/webp;base64,'+buf.toString('base64');
 tiles.push(`<article><b>${job.key}</b><div class="art" style="mask-image:url('${uri}')"></div><small>${job.file} · ${(buf.length/1024).toFixed(1)} KB</small></article>`);
}
const html=`<!doctype html><meta charset="utf-8"><style>body{background:#d7dce0;color:#17242c;font:13px Arial;margin:16px}main{display:grid;grid-template-columns:repeat(4,280px);gap:10px}article{background:#fafafa;border:1px solid #aab5bc;padding:8px}.art{width:264px;height:132px;background:#344e59;mask-repeat:no-repeat;mask-size:contain;mask-position:center}small{font-size:10px}</style><h2>Weapon silhouettes · 512 × 256 · CSS alpha masks</h2><main>${tiles.join('')}</main>`;
await fs.writeFile('docs/weapon-art-contact-sheet.html',html);
const browser=await chromium.launch({channel:'msedge',headless:true});try{const page=await browser.newPage({viewport:{width:1200,height:1200}});await page.setContent(html);await page.screenshot({path:'docs/weapon-art-contact-sheet.png',fullPage:true});}finally{await browser.close();}
console.log(`${jobs.length} transparent WebPs; ${bytes} bytes total`);
