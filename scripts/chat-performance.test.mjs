import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:800}});
 await page.setContent('<style>body{margin:0}#sidebar{position:fixed;right:0;top:0;width:320px;height:100vh;overflow:auto}.chat-message{width:300px}.hide{display:none}</style><aside id="sidebar"><div id="chat-log"></div></aside>');
 for(const file of ['chat-cards.css','pneuma-visualtools.css','chat-hub.css','chat-theme.css'])await page.addStyleTag({content:await readFile('dist/'+file,'utf8')});
 await page.addStyleTag({content:await readFile('../PneumaCombatTools/src/styles/pneuma-combattools.css','utf8')});
 await page.evaluate(()=>{
   window.counts={effects:0,cards:0,resize:0};window.kind='effects';
   const NativeObserver=window.MutationObserver;
   window.MutationObserver=class extends NativeObserver{constructor(callback){const kind=window.kind;super((records,observer)=>{counts[kind]++;callback(records,observer);});}};
 });
 for(const file of ['screen-effect-area','chat-presentation'])await page.addScriptTag({content:(await readFile('dist/'+file+'.js','utf8')).replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')});
 await page.evaluate(()=>{
   window.layer=document.createElement('canvas');mountScreenEffect(layer,true,()=>counts.resize++);
   window.kind='cards';
 });
 for(const skin of ['technical','cyberpunk','compact','compact-hub']){
   await page.evaluate(skin=>{
     document.querySelector('#chat-log').replaceChildren();
     for(let i=0;i<6;i++){
       const card=document.createElement('article');card.className='chat-message pneuma-chat-card pneuma-theme-'+(['technical','compact'].includes(skin)?'technical':'cyberpunk');
       card.classList.toggle('pneuma-skin-compact',skin.startsWith('compact'));
       card.innerHTML='<section class="pneuma-resolution-damage-roll"><h4 class="pneuma-resolution-label">Damage</h4><div class="d6-rollcard-data"><div class="d6-dice-div"><span>3</span><span>4</span></div><div class="d6-number-div">7</div><div class="d6-data-details hide">3 + 4</div></div></section>';
       document.querySelector('#chat-log').append(card);installRollPopovers(card);
       for(let n=0;n<4;n++)card.insertAdjacentHTML('beforeend','<section class="pneuma-resolution-effects"><h4 class="pneuma-resolution-label">Effects</h4><div class="pneuma-instant-effect"><strong>Poison</strong><span class="pneuma-effect-resistance"><strong>13</strong></span></div></section>');
     }
   },skin);
   await page.waitForTimeout(350);
   const settled=await page.evaluate(()=>({...counts}));
   await page.waitForTimeout(350);
   assert.deepEqual(await page.evaluate(()=>({...counts})),settled,skin+' settles after card additions and late effect controls');
   assert.equal(settled.effects,0,'chat subtree changes do not reach the screen-effect observer');
   assert.equal(settled.resize,1,'fixed sidebar size means no repeated effect resize');
   assert.ok(await page.locator('.pneuma-effect-resistance [data-pvt-popover]').count()>0,'late results still receive hover controls');
 }
 await page.setViewportSize({width:1200,height:900});
 await page.waitForFunction(()=>counts.resize===2);
 await page.evaluate(()=>document.querySelector('#sidebar').style.width='400px');
 await page.waitForFunction(()=>layer.parentElement.style.width==='910px');
 assert.ok(await page.evaluate(()=>counts.resize>=3),'real sidebar resizing still updates effects');
 await page.evaluate(()=>removeScreenEffect(layer));
 assert.equal(await page.locator('[data-pvt-screen-effect-area]').count(),0);
 console.log('Chat mutations settle across four skins; late controls work; screen effects ignore chat descendants and retain viewport/sidebar resizing.');
} finally {await browser.close();}
