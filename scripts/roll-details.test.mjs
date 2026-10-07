import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium} = await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel:'msedge', headless:true});
try {
  const page = await browser.newPage({viewport:{width:700,height:900}});
  const read = file => readFile(new URL('../dist/'+file,import.meta.url),'utf8');
  const source = (await read('chat-presentation.js')).replace(/^import .*;\r?\n/gm,'');
  await page.setContent('<style>.hide{display:none}*{box-sizing:border-box}.chat-message{width:300px;background:#ddd}.pneuma-inline-roll-details{display:none}</style>');
  await page.addStyleTag({content:await readFile(new URL('../../PneumaCombatTools/src/styles/pneuma-combattools.css',import.meta.url),'utf8')});
  await page.addStyleTag({content:await read('chat-cards.css')});
  await page.addStyleTag({content:await read('pneuma-visualtools.css')});
  await page.addStyleTag({content:await read('chat-hub.css')});
  await page.addStyleTag({content:'.d6-rollcard-data{display:grid;grid-template-areas:"dice total" "details details"}.d6-dice-div{grid-area:dice}.d6-number-div{grid-area:total}'});
  await page.addStyleTag({content:await read('chat-theme.css')});
  await page.addScriptTag({content:source.replace(/export /g,'')});
  await page.evaluate(()=>{
    const roll = (label,details) => `<details class="pneuma-inline-roll"><summary aria-label="${label}">9</summary><div class="pneuma-inline-roll-details">${details}</div></details>`;
    document.body.insertAdjacentHTML('beforeend',`<article id="card" class="chat-message pneuma-chat-card"><section class="pneuma-resolution-damage-roll pvt-full-section"><h4 class="pneuma-resolution-label">Damage</h4><div class="d6-rollcard-data"><div class="d6-dice-div">3 + 4</div><div class="d6-number-div">7</div><div class="d6-data-details hide"></div></div></section><section class="pneuma-resolution-damage-apply pvt-full-section"><h4 class="pneuma-resolution-label">Apply Damage</h4><div class="pneuma-damage-applied"><div class="pneuma-damage-applied-row"><span class="pneuma-applied-number" data-visible-element="receipt">6</span></div><div class="pneuma-applied-details receipt hide">Armor SP 9<a data-action="reverseDamage">Undo</a></div></div></section><section class="pneuma-resolution-effects pvt-full-section"><h4 class="pneuma-resolution-label">Effects</h4><div class="pneuma-instant-effect" data-state="resisted"><strong>Poison DV13</strong>${roll('Resist Torture/Drugs','Die 5 + skill 4')}</div><div class="pneuma-instant-effect pneuma-aoe-inline-effect"><strong>Sleep DV13</strong><details class="pneuma-inline-roll"><summary aria-label="Resist Torture/Drugs" aria-controls="aoe-detail">12</summary></details><div id="aoe-detail" hidden>Die 8 + skill 4</div></div></section></article>`);
    document.querySelector('.pneuma-resolution-effects').insertAdjacentHTML('beforeend',`<div id="native-effects" class="pneuma-instant-effect pneuma-aoe-inline-effect" style="--pneuma-ammo-color:#ad80df"><strong>Biotoxin DV15</strong><span class="pneuma-effect-resistance"><details class="pneuma-inline-roll"><summary data-pvt-popover="native" aria-label="Resist Torture/Drugs" aria-controls="native-resistance">11</summary></details></span><div class="pneuma-instant-damage"><span>Damage</span><details class="pneuma-inline-roll"><summary data-pvt-popover="native" aria-label="Damage roll">8</summary><div class="pneuma-inline-roll-details">Damage dice: 3 + 5</div></details></div><div id="native-resistance" class="pneuma-details-region" hidden>Resistance die: 7 + skill 4</div></div><div id="bare-effect" class="pneuma-instant-effect pneuma-aoe-inline-effect"><strong>Sleep DV13</strong><span class="pneuma-effect-resistance"><strong>13</strong></span></div>`);
    for (const resistance of document.querySelectorAll('.pneuma-aoe-inline-effect > .pneuma-effect-resistance')) {
      const actions=document.createElement('span'); actions.className='pneuma-effect-actions';
      resistance.before(actions); actions.append(resistance);
    }
    document.querySelector('#card').classList.add('pneuma-theme-technical');
    window.installRollPopovers(document.querySelector('#card'));
    window.installRollPopovers(document.querySelector('#card'));
  });
  for (const [selector,expected] of [['.d6-number-div',/3 \+ 4/],['.pneuma-applied-number',/Armor SP 9/],['.pneuma-instant-effect:not(.pneuma-aoe-inline-effect) summary',/Resist Torture\/Drugs[\s\S]*Die 5/],['[aria-controls="aoe-detail"]',/Die 8 \+ skill 4/],['#native-effects .pneuma-effect-resistance summary',/Resistance die: 7 \+ skill 4/],['#native-effects .pneuma-instant-damage summary',/Damage dice: 3 \+ 5/],['#bare-effect .pneuma-mini-value',/13/]]) {
    await page.locator(selector).hover();
    assert.match(await page.locator('#pneuma-roll-popover').innerText(),expected);
    assert.equal(await page.locator('#pneuma-roll-popover > .pneuma-popover-heading').count(),1);
    assert.equal(await page.locator('#pneuma-roll-popover > hr').count(),1);
    assert.ok(await page.locator('#pneuma-roll-popover').evaluate(el=>[el,...el.querySelectorAll('*')].every(node=>getComputedStyle(node).textAlign==='right')),'all nested hover content must align right');
    await page.mouse.move(650,850);
  }
  assert.equal(await page.locator('[data-action="reverseDamage"]').isVisible(),true);
  assert.doesNotMatch(await page.locator('#card').innerText(),/Resist Poison/);
  await page.locator('#native-effects .pneuma-effect-resistance summary').focus();
  assert.match(await page.locator('#pneuma-roll-popover').innerText(),/Resistance die: 7 \+ skill 4/);
  await page.locator('#native-effects .pneuma-effect-resistance summary').press('Escape');
  assert.equal(await page.locator('#pneuma-roll-popover').count(),0);
  // Also verify that Combat Tools loading its CSS later cannot restore the
  // cramped Resist prefix or supersede the smaller effect wells.
  await page.addStyleTag({content:await readFile(new URL('../../PneumaCombatTools/src/styles/pneuma-combattools.css',import.meta.url),'utf8')});
  const originalDetails = await page.locator('#native-resistance').evaluate(el=>{
    el.innerHTML='<br><br><p style="text-align:left !important">Resist Torture/Drugs<br><br>DV15<br><br></p><p> </p><div class="pneuma-calculation-text" style="text-align:left !important">\n\nResistance die: 7 + skill 4\n\n\nTotal: 11\n\n</div><br>';
    return el.innerHTML;
  });
  await page.locator('#native-effects .pneuma-effect-resistance summary').hover();
  assert.equal(await page.locator('#pneuma-roll-popover .pneuma-popover-heading').innerText(),'Biotoxin DV15 — Resistance');
  assert.equal(await page.locator('#pneuma-roll-popover .pneuma-calculation-text').innerText(),'Resistance die: 7 + skill 4\nTotal: 11');
  assert.equal(await page.locator('#pneuma-roll-popover br').count(),1,'keep meaningful line breaks without blank lines');
  assert.equal(await page.locator('#pneuma-roll-popover p').count(),1,'remove blank paragraph wrappers');
  assert.equal((await page.locator('#pneuma-roll-popover').innerText()).match(/Resist Torture\/Drugs/g).length,1,'avoid duplicating the skill label');
  assert.equal(await page.locator('#pneuma-roll-popover > hr').evaluate(el=>getComputedStyle(el).borderTopWidth),'1px');
  assert.ok(await page.locator('#pneuma-roll-popover').evaluate(el=>[el,...el.querySelectorAll('*')].every(node=>getComputedStyle(node).textAlign==='right')));
  assert.equal(await page.locator('#native-resistance').evaluate(el=>el.innerHTML),originalDetails,'saved breakdown must remain intact');
  await page.screenshot({path:new URL('../docs/hover-details-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.mouse.move(650,850);
  for(const skin of ['technical','cyberpunk']) for(const width of [260,300,400]) {
    await page.locator('#card').evaluate((el,{skin,width})=>{el.classList.remove('pneuma-theme-technical','pneuma-theme-cyberpunk');el.classList.add('pneuma-theme-'+skin);el.style.width=width+'px';},{skin,width});
    assert.ok(await page.locator('#card').evaluate(el=>el.scrollWidth<=el.clientWidth));
    const resistance=page.locator('#native-effects .pneuma-effect-resistance summary');
    const damage=page.locator('#native-effects .pneuma-instant-damage summary');
    assert.equal(await resistance.evaluate(el=>getComputedStyle(el,'::before').content),'none','native Resist prefix must be removed');
    assert.equal(await resistance.evaluate(el=>getComputedStyle(el).height),'24px');
    assert.equal(await damage.evaluate(el=>getComputedStyle(el).height),'24px');
    assert.notEqual(await resistance.evaluate(el=>getComputedStyle(el).backgroundColor),await damage.evaluate(el=>getComputedStyle(el).backgroundColor));
    assert.notEqual(await resistance.evaluate(el=>getComputedStyle(el).borderRadius),await damage.evaluate(el=>getComputedStyle(el).borderRadius));
    assert.equal(await page.locator('#native-effects .pvt-effect-roll-icon').count(),2,'icons must be idempotent');
    for(const section of await page.locator('.pvt-section-rail').all()) {
      const rail=section.locator(':scope > .pvt-section-rail-label');
      assert.equal(await rail.evaluate(el=>getComputedStyle(el).writingMode),'vertical-rl');
      assert.notEqual(await rail.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
      const a=await section.boundingBox(),b=await rail.boundingBox();
      assert.ok(b.width<=22 && b.x>=a.x && b.y>=a.y && b.y+b.height<=a.y+a.height+1);
    }
  }
  await page.screenshot({path:new URL('../docs/roll-details-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.evaluate(()=>{
    document.querySelector('#card').remove();
    document.body.insertAdjacentHTML('beforeend',`<article id="aoe-layout" class="chat-message pneuma-chat-card pneuma-unified-header pneuma-plain-chat pneuma-theme-cyberpunk"><div class="message-content"><section class="pneuma-aoe-card"><section class="pneuma-resolution-result"><div class="pneuma-resolution-body"><div class="pneuma-aoe-targets"><div class="pneuma-aoe-target"><span>Rage</span><button data-aoe-action="reset">Reset</button></div></div></div></section><div class="pneuma-damage-result"><section class="pneuma-resolution-section pneuma-resolution-damage-roll"><h4 class="pneuma-resolution-label">Damage roll</h4><div class="pneuma-resolution-body pneuma-resolution-damage-roll-body"><div class="rollcard-top"><div class="cpr-block"><div class="pneuma-damage-heading"><span class="pneuma-damage-label">Damage</span><span class="pneuma-damage-ammo">Incendiary</span></div></div></div><div class="d6-rollcard-data"><div class="d6-dice-div">4 + 4 + 2 + 6 + 2 + 1</div><div class="d6-number-div">19</div><div class="d6-data-details hide">6d6</div></div><div class="pneuma-aoe-effects-picker"><button data-effect="fire">Fire</button><button data-effect="biotoxin">Biotoxin</button></div></div></section></div><section class="pneuma-resolution-section pneuma-resolution-damage-apply"><h4 class="pneuma-resolution-label">Apply damage</h4><div class="pneuma-resolution-body"><div class="pneuma-damage-applications"><div class="pneuma-damage-applied"><div class="pneuma-damage-applied-row"><span class="pneuma-applied-name">Rage</span><span class="pneuma-applied-number" data-visible-element="aoe-receipt">19</span></div><div class="pneuma-applied-details aoe-receipt hide">Damage rolled 19; effective SP 20; HP reduced 0; ablation 2</div></div><p class="pneuma-cover-up-damage">Cover Up: armor SP ×2; all worn armor ablates ×2.</p></div></div></section></section></div></article>`);
    window.installRollPopovers(document.querySelector('#aoe-layout'));
    window.installRollPopovers(document.querySelector('#aoe-layout'));
  });
  const defenders=page.locator('.pvt-aoe-defenders');
  await page.locator('.pneuma-aoe-card').evaluate(card=>{
    const actions=document.createElement('div');actions.className='pneuma-aoe-actions';actions.innerHTML='<button data-aoe-action="show">Show area</button><button data-aoe-action="add">Add target</button>';
    const note=document.createElement('p');note.className='test-cover-note';note.textContent='GM resolves all aspects of cover and terrain.';
    card.querySelector('.pneuma-resolution-result').after(actions,note);
    window.installRollPopovers(document.querySelector('#aoe-layout'));
  });
  assert.equal(await defenders.count(),1);
  assert.equal(await defenders.evaluate(el=>el.open),false);
  assert.equal(await page.locator('[data-aoe-action="show"]').isVisible(),false);
  assert.equal(await page.locator('.test-cover-note').isVisible(),false);
  await defenders.locator('summary').click();
  assert.equal(await page.locator('[data-aoe-action="reset"]').isVisible(),true);
  assert.equal(await page.locator('[data-aoe-action="show"]').isVisible(),true);
  assert.equal(await page.locator('.test-cover-note').isVisible(),true);
  await page.locator('#aoe-layout').evaluate(el=>window.installRollPopovers(el));
  assert.equal(await defenders.evaluate(el=>el.open),true,'manual expansion survives adapter reruns');
  assert.equal(await page.locator('.pvt-damage-footer').count(),1);
  assert.equal(await page.locator('#aoe-layout .pneuma-resolution-damage-roll > .pvt-section-rail-label').innerText(),'Damage');
  assert.equal(await page.locator('#aoe-layout .pneuma-resolution-damage-apply > .pvt-section-rail-label').innerText(),'Apply');
  const damageToggle=page.locator('.pvt-damage-toggle');
  assert.equal(await damageToggle.getAttribute('aria-expanded'),'true');
  const expandedDamage=await page.locator('.pneuma-resolution-damage-roll').boundingBox();
  await damageToggle.click();
  assert.equal(await page.locator('.d6-number-div').isVisible(),false);
  assert.equal(await page.locator('.pvt-damage-footer').isVisible(),false);
  assert.equal(await page.locator('.pneuma-applied-number').isVisible(),true,'application section remains visible');
  assert.ok((await page.locator('.pneuma-resolution-damage-roll').boundingBox()).height<expandedDamage.height);
  await page.locator('#aoe-layout').evaluate(el=>window.installRollPopovers(el));
  assert.equal(await damageToggle.getAttribute('aria-expanded'),'false','collapse survives layout updates');
  await damageToggle.focus();await damageToggle.press('Enter');
  assert.equal(await page.locator('.d6-number-div').isVisible(),true);
  assert.equal(await page.locator('.pvt-damage-footer').isVisible(),true);
  assert.equal(await page.locator('.pneuma-damage-label').isVisible(),false);
  assert.equal(await page.locator('.pneuma-cover-up-damage').isVisible(),false);
  await page.locator('#aoe-layout .pneuma-applied-number').hover();
  assert.match(await page.locator('#pneuma-roll-popover').innerText(),/effective SP 20; HP reduced 0; ablation 2/);
  assert.match(await page.locator('#pneuma-roll-popover').innerText(),/Cover Up: armor SP ×2/);
  await page.mouse.move(650,850);
  for (const skin of ['technical','cyberpunk']) for (const width of [260,300,400]) {
    await page.locator('#aoe-layout').evaluate((el,{skin,width})=>{el.classList.remove('pneuma-theme-technical','pneuma-theme-cyberpunk');el.classList.add('pneuma-theme-'+skin);el.style.width=width+'px';},{skin,width});
    const damage=await page.locator('.pneuma-resolution-damage-roll').boundingBox();
    const apply=await page.locator('.pneuma-resolution-damage-apply').boundingBox();
    assert.equal(damage.x,apply.x,'nested damage rail must be flush with application rail');
    const ammo=await page.locator('.pneuma-damage-ammo').boundingBox(),picker=await page.locator('.pneuma-aoe-effects-picker').boundingBox();
    assert.ok(picker.x>=ammo.x+ammo.width && ammo.y<picker.y+picker.height && ammo.y+ammo.height>picker.y,'ammo is left of the effect controls on the same line');
    assert.equal(await page.locator('.pneuma-damage-ammo').evaluate(el=>getComputedStyle(el).textAlign),'left');
    const rail=page.locator('.pneuma-resolution-damage-roll > .pvt-section-rail-label');
    assert.equal(await rail.evaluate(el=>getComputedStyle(el).fontSize),'13px');
    assert.equal(await rail.evaluate(el=>getComputedStyle(el).paddingInlineStart),'0px');
    const toggle=page.locator('.pvt-damage-toggle'),toggleBox=await toggle.boundingBox();
    assert.ok(Math.abs(toggleBox.x-damage.x)<=1);assert.ok(Math.abs(toggleBox.y-damage.y)<=1);
    assert.equal(await toggle.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
    assert.equal(await rail.locator('button').count(),0,'rail text must remain a label rather than a native button');
    assert.equal(await rail.evaluate(el=>getComputedStyle(el).borderLeftWidth),'1px');
    assert.ok(await page.locator('#aoe-layout').evaluate(el=>el.scrollWidth<=el.clientWidth));
  }
  await page.locator('.pneuma-damage-ammo').evaluate(el=>{el.textContent='Basic';window.installRollPopovers(document.querySelector('#aoe-layout'));});
  assert.equal(await page.locator('.pneuma-damage-ammo').isVisible(),false);
  await page.locator('.pneuma-damage-ammo').evaluate(el=>{el.textContent='Incendiary';window.installRollPopovers(document.querySelector('#aoe-layout'));});
  assert.equal(await page.locator('.pneuma-damage-ammo').isVisible(),true);
  await defenders.locator('summary').click();
  await page.screenshot({path:new URL('../docs/damage-layout-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.locator('.d6-number-div').evaluate(el=>el.remove());
  await page.locator('#aoe-layout').evaluate(el=>window.installRollPopovers(el));
  assert.equal(await page.locator('.pvt-aoe-defenders').count(),0,'responses remain visible when the damage roll is absent');
  assert.equal(await page.locator('[data-aoe-action="reset"]').isVisible(),true);
  assert.equal(await page.locator('.pneuma-aoe-card > .pneuma-aoe-actions').count(),1);
  assert.equal(await page.locator('.pneuma-aoe-card > .test-cover-note').count(),1);
  assert.equal(await page.locator('[data-aoe-action="show"]').isVisible(),true);
  await page.addScriptTag({content:(await read('chat-dice.js')).replace(/export /g,'')});
  await page.addScriptTag({content:'const esc = value => String(value);\n'+(await readFile(new URL('../../PneumaCombatTools/dist/scripts/inline-roll.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/export /g,'')});
  await page.route('**/systems/cyberpunk-red-core/icons/dice/**',route=>{
    const face=route.request().url().match(/d6_(\d)/)?.[1] || '?';
    return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42"><rect x="1" y="1" width="40" height="40" rx="5" fill="#172b35" stroke="#64e9ee"/><text x="21" y="30" text-anchor="middle" fill="#64e9ee" font-size="28">${face}</text></svg>`});
  });
  await page.evaluate(()=>{
    const base=document.createElement('base');base.href='http://dice.test/';document.head.append(base);
    window.game={settings:{get:()=>false}};
    const native='<div class="dice-roll"><div class="dice-formula">3d6</div><div class="dice-tooltip" style="display:none"><section class="tooltip-part"><div class="part-header">3d6 <span>7</span></div><ol class="dice-rolls"><li class="roll die d6">3</li><li class="roll die d6">1</li><li class="roll die d6">3</li></ol></section></div><h4 class="dice-total">7</h4></div>';
    const card=document.querySelector('#aoe-layout');
    card.querySelector('.message-content').innerHTML='<div id="preserved-dice" class="pneuma-instant-effect pneuma-aoe-inline-effect"><strong>Biotoxin DV15</strong><div class="pneuma-instant-damage"><span>Damage</span>'+inlineRoll(7,native,'Damage roll',true)+'</div></div>';
    arrangeInlineRollDetails(card);
    const details=card.querySelector('.pneuma-details-region');
    if(details.dataset.pneumaRollHtml!==native)throw Error('Native rendered dice markup was lost');
    if(details.querySelector('img,.dice-rolls'))throw Error('Native click disclosure must remain compact');
    window.installRollPopovers(card);
  });
  for(const skin of ['technical','cyberpunk']) for(const width of [260,300,400]) {
    await page.locator('#aoe-layout').evaluate((el,{skin,width})=>{el.classList.remove('pneuma-theme-technical','pneuma-theme-cyberpunk');el.classList.add('pneuma-theme-'+skin);el.style.width=width+'px';},{skin,width});
    await page.locator('#preserved-dice summary').hover();
    assert.equal(await page.locator('#pneuma-roll-popover .d6-dice-div img').count(),3,'flattened compact damage hover must restore saved dice');
    assert.deepEqual(await page.locator('#pneuma-roll-popover img').evaluateAll(images=>images.map(image=>image.alt)),['D6: 3','D6: 1','D6: 3']);
    assert.equal(await page.locator('#preserved-dice summary').innerText(),'7','saved total must remain unchanged');
    assert.equal(await page.locator('#pneuma-roll-popover .pneuma-calculation-text').count(),0,'hover uses original dice markup rather than flattened numbers');
    assert.equal(await page.locator('#pneuma-roll-popover .pneuma-popover-heading').innerText(),'Biotoxin DV15 — Damage');
    assert.ok(await page.locator('#pneuma-roll-popover').evaluate(el=>el.scrollWidth<=el.clientWidth));
    await page.mouse.move(650,850);
  }
  await page.locator('#preserved-dice summary').hover();
  await page.screenshot({path:new URL('../docs/effect-dice-hover-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.mouse.move(650,850);
  await page.locator('#aoe-layout').evaluate(card=>{
    card.querySelector('.message-content').innerHTML='<section class="pneuma-resolution-damage-apply pvt-full-section"><div class="pneuma-resolution-body"><div class="pneuma-aoe-applications"><div class="pneuma-aoe-resolution-target"><img alt="" src="data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\"/%3E"><span class="pneuma-aoe-name">Rage</span><div class="pneuma-aoe-target-damage"><div class="pneuma-damage-applications"><div class="pneuma-damage-applied"><div class="pneuma-damage-applied-row"><span class="pneuma-applied-number">19</span><span class="pneuma-applied-location">Body</span><a class="pneuma-damage-undo">↶</a></div></div></div></div></div></div></div></section>';
  });
  for(const skin of ['technical','cyberpunk']) for(const width of [260,300,400]) {
    await page.locator('#aoe-layout').evaluate((el,{skin,width})=>{el.classList.remove('pneuma-theme-technical','pneuma-theme-cyberpunk');el.classList.add('pneuma-theme-'+skin);el.style.width=width+'px';el.querySelector('.pneuma-reversal-status')?.remove();},{skin,width});
    const before=await page.locator('.pneuma-applied-number').boundingBox();
    await page.locator('.pneuma-damage-applied-row').evaluate(row=>{const status=document.createElement('span');status.className='pneuma-reversal-status';status.textContent='✓ Damage reversed';row.append(status);});
    const after=await page.locator('.pneuma-applied-number').boundingBox(),status=await page.locator('.pneuma-reversal-status').boundingBox();
    assert.equal(after.x,before.x,'reversal status must not shift the damage box');
    assert.ok(status.x+status.width<=after.x,'reversal message belongs left of the damage box');
    assert.equal(await page.locator('.pneuma-aoe-applications').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px','no extra inner application divider');
    assert.ok(await page.locator('#aoe-layout').evaluate(el=>el.scrollWidth<=el.clientWidth));
  }
  console.log('Saved dice hovers, compact effects, section rails, AoE collapse and stable reversed-damage totals passed in both skins at 260/300/400px.');
} finally {await browser.close();}

