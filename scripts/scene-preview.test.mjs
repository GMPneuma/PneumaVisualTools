import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'file:///C:/Users/Jerem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:800}});
 await page.setContent('<canvas id="board" style="width:1000px;height:600px"></canvas><div id="pack" style="position:absolute;left:700px;top:100px"><div data-document-id="s" style="width:150px;height:40px"><h4 class="document-name">Map</h4><img src="data:image/svg+xml,&lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;20&quot; height=&quot;20&quot;/&gt;" alt="Map thumbnail"></div></div>');
 await page.addStyleTag({content:await readFile(new URL('../dist/pneuma-visualtools.css',import.meta.url),'utf8')});
 await page.evaluate(()=>{window.hooks={};window.Hooks={on:(n,f)=>hooks[n]=f};window.Scene=class{};window.ImagePopout=class{constructor(src,options){window.opened={src,options};}async _render(){} setPosition(position){window.popoutPosition=position;}render(){window.rendered=true;void this._render();}};window.scene=Object.assign(new Scene(),{name:'Map',thumb:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"/>',background:{src:'maps/full-map.webp'},width:4000,height:3000,grid:{type:1,size:100,distance:2,units:'m'}});});
 const code=(await readFile(new URL('../dist/scene-preview.js',import.meta.url),'utf8')).replace(/^export /gm,'');
 await page.addScriptTag({content:code+'\nregisterScenePreviews();'});
 await page.evaluate(()=>hooks.renderCompendium({collection:{documentName:'Scene',getDocument:async()=>scene}},[document.querySelector('#pack')]));
 await page.locator('[data-document-id]').hover();await page.locator('.pvt-scene-preview').waitFor();
 assert.equal((await page.locator('.pvt-scene-preview').boundingBox()).width,420);
 assert.equal(await page.locator('.pvt-scene-preview button, .pvt-scene-preview [role=button]').count(),0);
 await page.locator('#pack .document-name').click();await page.waitForFunction(()=>window.popoutPosition);
 assert.equal(await page.evaluate(()=>opened.src),'maps/full-map.webp');assert.equal(await page.evaluate(()=>rendered),true);assert.deepEqual(await page.evaluate(()=>popoutPosition),{width:750,height:450,left:225,top:175});assert.ok(await page.evaluate(()=>opened.options.classes.includes('pvt-scene-image-popout')));
 assert.equal(await page.locator('.pvt-scene-preview').count(),0);
 await page.locator('#pack img').click();assert.equal(await page.evaluate(()=>opened.src),'maps/full-map.webp');
 console.log('Scene preview checks passed: view-only hover, entry name/thumbnail clicks and 75% canvas pop-out sizing.');
}finally{await browser.close();}


