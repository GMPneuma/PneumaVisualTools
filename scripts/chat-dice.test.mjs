import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {diceFiles, systemDie} from '../dist/chat-dice.js';
const {chromium} = await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
assert.equal(diceFiles.length,31);
for(const [source,file] of [
  ['black/d10_1.svg','d10_1'], ['red/d10_10.svg','critical_d10_10'],
  ['black/d10_10_preem.svg','d10_preem'], ['red/d10_1_fail.svg','critical_d10_fail'],
  ['black/d6_6.svg','d6_6'], ['red/d6_6_preem.svg','d6_6_preem']
]) assert.equal(systemDie('systems/cyberpunk-red-core/icons/dice/'+source).file,file);
for(const source of ['black/d10_11.svg','black/d6_0.svg','black/d20_1.svg'])
  assert.equal(systemDie('systems/cyberpunk-red-core/icons/dice/'+source),undefined);
for(const file of diceFiles) assert.ok((await readFile(new URL('../dist/dice-pneuma-'+file+'.webp',import.meta.url))).length>100);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror',error=>console.error('Browser error:',error.message));
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="purple"/></svg>';
  await page.route('http://dice.test/**',route=>route.request().url()==='http://dice.test/'
    ? route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'})
    : route.request().url().includes('/missing/') ? route.fulfill({status:404,body:''}) : route.fulfill({contentType:'image/svg+xml',body:svg}));
  await page.goto('http://dice.test/');
  await page.setContent('<base href="http://dice.test/"><section class="chat-message" id="card"></section>');
  await page.addStyleTag({content:await readFile(new URL('../dist/chat-dice.css',import.meta.url),'utf8')});
  await page.evaluate(()=>{
    window.values={};window.registered={};window.hooks={};window.menus={};
    window.game={user:{isGM:true},modules:new Map(),settings:{
      register:(_m,key,config)=>{registered[key]=config;values[key]=config.default;},
      registerMenu:(_m,key,config)=>menus[key]=config,
      get:(_m,key)=>values[key],set:async(_m,key,value)=>{values[key]=value;registered[key]?.onChange?.(value);}
    }};
    window.Hooks={on:(key,handler)=>hooks[key]=handler};
    window.FormApplication=class {static get defaultOptions(){return {};}activateListeners(){}render(){return this;}close(){}};
    let nextId=0;
    window.foundry={utils:{randomID:()=>`set-${++nextId}`,mergeObject:(a,b)=>({...a,...b})}};
    window.FilePicker=class {constructor(options){this.options=options;}render(){this.options.callback('custom');}};
  });
  await page.addScriptTag({type:'module',content:(await readFile(new URL('../dist/chat-dice.js',import.meta.url),'utf8'))+'\nwindow.diceAPI={registerChatDice,replaceChatDice,refreshChatDice,customDicePath,diceFiles,diceSets};registerChatDice();'});
  await page.waitForFunction(()=>!!window.diceAPI);
  const settingsSource=(await readFile(new URL('../dist/chat-dice-settings.js',import.meta.url),'utf8')).replace(/^import .*;\s*/m,'const {customDicePath,diceFiles,diceSets,refreshChatDice}=window.diceAPI;\n');
  await page.addScriptTag({type:'module',content:settingsSource+'\nwindow.ChatDiceSettings=ChatDiceSettings;registerChatDiceMenu();'});
  await page.waitForFunction(()=>!!window.ChatDiceSettings);
  await page.evaluate(()=>{
    const stock=file=>'systems/cyberpunk-red-core/icons/dice/'+file+'.svg';
    document.querySelector('#card').innerHTML='<div class="d10-dice-div"><img id="normal" src="'+stock('black/d10_8')+'"><img id="critical" src="'+stock('red/d10_1_fail')+'"></div><div class="d6-dice-div"><img id="six1" class="d6-60" src="'+stock('black/d6_6')+'"><img id="six2" src="'+stock('black/d6_6')+'"></div><img id="portrait" src="portrait.svg">';
    hooks.renderChatMessage({},[document.querySelector('#card')]);
  });
  assert.match(await page.locator('#normal').getAttribute('src'),/dice-pneuma-d10_8.webp$/);
  assert.match(await page.locator('#critical').getAttribute('src'),/dice-pneuma-critical_d10_fail.webp$/);
  for(const id of ['six1','six2'])assert.match(await page.locator('#'+id).getAttribute('src'),/d6_6_preem.webp$/);
  assert.equal(await page.locator('#portrait').getAttribute('src'),'portrait.svg');
  assert.equal(await page.locator('#six1').evaluate(el=>el.getBoundingClientRect().width),60,'native-only card constrains D6 replacement');
  await page.evaluate(()=>game.settings.set('pneuma-visualtools','chatDiceEnabled',false));
  assert.match(await page.locator('#normal').getAttribute('src'),/black\/d10_8.svg$/);
  await page.evaluate(async()=>{
    await game.settings.set('pneuma-visualtools','chatDiceSets',[{id:'custom',name:'Custom',folder:'custom',extension:'png'}]);
    await game.settings.set('pneuma-visualtools','chatDiceSet','custom');
    await game.settings.set('pneuma-visualtools','chatDiceEnabled',true);
  });
  assert.equal(await page.locator('#normal').getAttribute('src'),'custom/d10_8.png');
  assert.equal(await page.locator('#critical').getAttribute('src'),'custom/critical_d10_fail.png');
  await page.evaluate(async()=>{
    await game.settings.set('pneuma-visualtools','chatDiceSets',[{id:'missing',name:'Missing',folder:'missing',extension:'webp'}]);
    await game.settings.set('pneuma-visualtools','chatDiceSet','missing');
  });
  await page.waitForFunction(()=>document.querySelector('#normal').getAttribute('src').endsWith('dice-pneuma-d10_8.webp'));
  await page.evaluate(()=>{
    const clone=document.querySelector('#normal').cloneNode();clone.id='copy';document.querySelector('#card').append(clone);
  });
  await page.evaluate(()=>game.settings.set('pneuma-visualtools','chatDiceEnabled',false));
  assert.match(await page.locator('#copy').getAttribute('src'),/black\/d10_8.svg$/,'popup copies retain native source');
  await page.evaluate(async()=>{
    await game.settings.set('pneuma-visualtools','chatDiceSets',[]);
    await game.settings.set('pneuma-visualtools','chatDiceEnabled',true);
    document.querySelector('#card').insertAdjacentHTML('beforeend','<img id="late" src="systems/cyberpunk-red-core/icons/dice/black/d10_9.svg">');
  });
  await page.waitForFunction(()=>document.querySelector('#late').getAttribute('src').endsWith('dice-pneuma-d10_9.webp'));
  // Exercise the menu's native controls and settings handlers independently of
  // Foundry's application chrome/template renderer.
  await page.evaluate(()=>{
    window.menu=new ChatDiceSettings();
    const form=document.createElement('form');form.id='menu';
    form.innerHTML='<input name="setName" value="My set"><input name="folder" value="custom"><select name="extension"><option>png</option></select><button type="button" data-browse>Browse</button><button type="button" data-validate>Validate</button><button type="button" data-add>Add</button><p data-status></p><button type="button" data-remove="missing">Remove</button>';
    document.body.append(form);menu.activateListeners([form]);
  });
  await page.locator('[data-validate]').click();
  await page.waitForFunction(()=>document.querySelector('[data-status]').textContent==='All 31 images are available.');
  await page.locator('[data-add]').click();
  await page.waitForFunction(()=>values.chatDiceSets.length===1 && values.chatDiceSet===values.chatDiceSets[0].id);
  assert.equal(await page.locator('#normal').getAttribute('src'),'custom/d10_8.png');
  await page.evaluate(()=>{document.querySelector('[data-remove]').dataset.remove=values.chatDiceSets[0].id;});
  await page.locator('[data-remove]').click();
  await page.waitForFunction(()=>values.chatDiceSets.length===0);
  assert.match(await page.locator('#normal').getAttribute('src'),/dice-pneuma-d10_8.webp$/);
  await page.evaluate(()=>{game.user.isGM=false;});
  await page.locator('[data-add]').click();
  assert.equal(await page.evaluate(()=>values.chatDiceSets.length),0,'players cannot modify shared sets');
  assert.equal(await page.evaluate(()=>menu.getData().isGM),false);
  assert.equal(await page.evaluate(()=>menus.chatDiceMenu.restricted),false,'players can select registered sets');
  console.log('Chat dice: bundled assets, face/critical mapping, master switch, custom sets, fallback, copies, late dice, native sizing and GM menu permissions passed.');
} finally {await browser.close();}
