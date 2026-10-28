import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const scene=await readFile('../PneumaSceneTools/dist/styles/scanner.css','utf8');
const visual=await readFile('dist/chat-cards.css','utf8');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:420,height:240}});
 for(const reverse of [false,true]) {
  await page.setContent('<style>body{font:14px sans-serif}.chat-message{width:300px;padding:8px} .pneuma-chat-card{--pvt-damage-button-bg:rgb(12,34,56);--pvt-damage-button-ink:rgb(220,230,240);--pvt-damage-button-border:rgb(90,120,150);--pvt-gm-hover:rgb(23,45,67);--pvt-accent:rgb(40,180,190)}</style><article class="chat-message pneuma-chat-card"><div class="message-content"></div></article>');
  for(const css of reverse?[visual,scene]:[scene,visual])await page.addStyleTag({content:css});
  // Insert after card styling, matching either render-hook order. No CT CSS/JS.
  await page.evaluate(()=>{
   const button=document.createElement('button');button.type='button';button.className='pneuma-open-scanner';button.dataset.pneumaChatAction='scanner';button.dataset.chatRole='gm';button.textContent='Reveal Access Points to Netrunner';button.onclick=()=>window.clicks=(window.clicks||0)+1;document.querySelector('.message-content').append(button);
  });
  const button=page.locator('button');
  await page.mouse.move(410,230);
  assert.equal(await button.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(12, 34, 56)');
  assert.equal(await button.evaluate(el=>getComputedStyle(el).color),'rgb(220, 230, 240)');
  assert.equal(await button.evaluate(el=>getComputedStyle(el,'::before').content),'"GM"');
  await button.hover();assert.equal(await button.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(23, 45, 67)');
  await button.focus();assert.equal(await button.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  await page.keyboard.press('Enter');assert.ok(await page.evaluate(()=>window.clicks>0));
  assert.ok(await button.evaluate(el=>el.scrollWidth<=el.clientWidth));
  await button.evaluate(el=>el.disabled=true);assert.equal(await button.isDisabled(),true);
 }
 await page.setContent('<article class="chat-message"><button class="pneuma-open-scanner" data-pneuma-chat-action="scanner" data-chat-role="gm">Reveal Access Points to Netrunner</button></article>');
 await page.addStyleTag({content:scene});
 assert.equal(await page.locator('button').isEnabled(),true);
 assert.equal(await page.locator('button').evaluate(el=>getComputedStyle(el,'::before').content),'none');
 console.log('Scanner button: both stylesheet orders, late insertion, GM marker, hover/focus, keyboard click, disabled state and native fallback passed without CombatTools.');
} finally {await browser.close();}
