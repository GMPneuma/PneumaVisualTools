
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();await page.setContent('<form><div class="form-group"><input name="pneuma-visualtools.chatSkin" value="compact"></div><div class="form-group"><input type="checkbox" name="pneuma-visualtools.chatCards" checked></div><div class="form-group"><input name="pneuma-visualtools.chatFallbackImage" value="old.webp"></div><div class="form-group"><input type="checkbox" name="pneuma-visualtools.weaponSounds" checked></div><div class="form-group"><input name="pneuma-visualtools.weaponVolume" value="35"></div></form>');
await page.evaluate(()=>{window.FilePicker=class{constructor(options){window.picker=options}render(){}}});
await page.addScriptTag({content:(await readFile(new URL('../dist/settings-layout.js',import.meta.url),'utf8')).replace(/export /g,'')});
await page.evaluate(()=>{groupVisualSettings(document.querySelector('form'));groupVisualSettings(document.querySelector('form'));});
assert.equal(await page.locator('[data-pvt-portrait-picker]').count(),1);
assert.equal(await page.locator('fieldset[data-pvt-settings-master] > legend').count(),2);
assert.equal(await page.locator('.pvt-settings-groups h3').count(),0);
assert.equal(await page.locator('[data-pvt-settings-master="chatCards"] .form-group').first().locator('input').getAttribute('name'),'pneuma-visualtools.chatCards');
await page.locator('[data-pvt-portrait-picker]').click();assert.equal(await page.evaluate(()=>picker.type),'image');await page.evaluate(()=>picker.callback('picked.webp'));
await page.locator('[name="pneuma-visualtools.chatCards"]').uncheck();assert.equal(await page.locator('[name="pneuma-visualtools.chatFallbackImage"]').evaluate(input=>input.closest('.form-group').inert),true);
assert.equal(await page.evaluate(()=>new FormData(document.querySelector('form')).get('pneuma-visualtools.chatFallbackImage')),'picked.webp');
await page.locator('[name="pneuma-visualtools.chatCards"]').check();assert.equal(await page.locator('[name="pneuma-visualtools.chatFallbackImage"]').evaluate(input=>input.closest('.form-group').inert),false);
console.log('Master-first groups, inert dependents with preserved native submission, idempotence and image picker passed.');}finally{await browser.close();}
