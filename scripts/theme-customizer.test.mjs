import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
import {DEFAULT_THEME,generatePalette,contrastWarnings,normalizeTheme,paletteVariables,onColor,contrast} from '../dist/theme-palette.js';
import {BASE_SKINS, BASE_SURFACES, baseMode, baseVariables, adaptPalette} from '../dist/base-skins.js';
import {PNEUMA_PRESETS,normalizePersonalPresets} from '../dist/theme-presets.js';
for(const mode of ['light','dark']) for(const seed of ['#ffff00','#0000ff','#ff00ff','#00ffff','#ff0000','#ffffff','#000000','#888888']) {
 const p=generatePalette(seed,mode);assert.equal(p.main,seed);assert.deepEqual(contrastWarnings(p,mode).filter(w=>!w.startsWith('Main accent border')),[],`${mode} ${seed}`);assert.ok(contrast(onColor(seed),seed)>=4.5);
 for(const key of ['color-red','background-window','background-foundry-input','text-normal','text-chat-failure','text-chat-success','background-row-odd']) assert.equal(paletteVariables(p,mode)['--cpr-'+key],undefined,key+' stays native');
 assert.notEqual(paletteVariables(p,mode)['--cpr-text-chat-failure'],p.main);
}
assert.equal(normalizeTheme({}).tintRows,false);
assert.equal(normalizeTheme({}).colorizeButtons,true);assert.equal(normalizeTheme({}).colorizeGlows,true);
const noGlow=paletteVariables(DEFAULT_THEME.light,'light',false,false);
for(const key of ['--color-shadow-primary','--color-shadow-highlight','--cpr-background-foundry-hover'])assert.equal(noGlow[key],undefined);

for(const mode of ['light','dark']) {
 const old={...structuredClone(DEFAULT_THEME),method:'manual',mode,light:{...DEFAULT_THEME.light,main:'#ff8800',bright:'#ff0000'},dark:{...DEFAULT_THEME.dark,main:'#3388cc',bright:'#00ff00'}};
 const migrated=normalizeTheme(old);
 assert.equal(migrated.seed,old.seed);
 assert.equal(migrated.method,'manual');
 assert.deepEqual(migrated.light,old.light);
 assert.deepEqual(migrated.dark,old.dark);
 assert.deepEqual(normalizeTheme(migrated),migrated,'Migration is stable');
}

assert.equal(normalizeTheme({light:{main:'red; background:url(bad)'}}).light.main,DEFAULT_THEME.light.main);
assert.equal(PNEUMA_PRESETS.length,3);assert.equal(normalizePersonalPresets([]).length,3);
for(const {id} of BASE_SKINS) for(const seed of ['#ffffff','#000000','#ff00ff','#00ffff','#888888']) {
 const raw=generatePalette(seed,baseMode(id)),original=structuredClone(raw),p=adaptPalette(raw,id);
 assert.deepEqual(raw,original,'Adaptation preserves saved colors');
 assert.equal(p.main,seed,'Base adaptation preserves exact primary');
 const {contrast}=await import('../dist/theme-palette.js');
 assert.ok(contrast(p.deep,BASE_SURFACES[id].window)>=4.5);
 assert.ok(contrast(p.pale,p.main)>=4.5);
 assert.equal(paletteVariables(p,baseMode(id))['--cpr-background-window'],undefined);
}
for(const {id} of BASE_SKINS) {
 const source={...DEFAULT_THEME[baseMode(id)],main:'#8040c0'};
 const purple=adaptPalette(source,id), green=adaptPalette({...source,main:'#40c080'},id);
 assert.notEqual(purple.odd,green.odd,'Primary changes odd rows');assert.equal(purple.even,green.even,'Even rows retain stock base color');
 const legacy=adaptPalette({...source,odd:'#ff0000',even:'#00ffff'},id);
 assert.equal(legacy.odd,purple.odd);assert.equal(legacy.even,purple.even);
 const stock=id==='default-light'?BASE_SURFACES[id].panel:baseVariables(id)['--cpr-background-row-odd']??BASE_SURFACES[id].row;
 for(const main of ['#00ff00','#ff0000','#0000ff','#ffffff','#000000']) {
  const row=adaptPalette({...source,main},id).odd;
  for(const channel of [1,3,5]) assert.ok(Math.abs(parseInt(row.slice(channel,channel+2),16)-parseInt(stock.slice(channel,channel+2),16))<=77,'Row tint remains base-weighted even for saturated primaries');
 }
 assert.notEqual(purple.odd,purple.even,'Alternating shades remain distinct');
}
assert.deepEqual(baseVariables('default-light'),{});assert.deepEqual(baseVariables('default-dark'),{});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1300,height:950}});
 await page.setContent('<div id="native" class="sheet window-app"><header class="window-header"><h4 class="window-title">Character</h4><a class="header-button"><i>×</i>Close</a><button type="button">Menu</button></header><div class="window-content"><h2>Existing sheet</h2><nav class="navtabs-right"><a class="tab-label active"><span class="tab-highlight">Skills</span></a><a class="tab-label">Gear</a></nav><div class="skills-tab"><ol class="items-list"><li class="items-header">Combat skills</li><li class="item"><span class="text-pill">REF</span><input class="skill-input" value="6"></li><li class="item"><div class="item-name"><a data-roll-type="skill">Second skill</a></div><span class="skill-base">12</span></li><li class="item">Third skill</li></ol></div></div></div><div id="native-dialog" class="window-app"><div class="window-content"><form class="dialog-sheet"><h2>Existing roll dialog</h2><div class="dialog-item flexrow">REF <input type="number" value="8"></div><div class="dialog-item flexrow">Handgun <input type="number" value="6"></div><div class="dialog-footer"><button class="cpr-dialog-button" type="button">Confirm</button></div></form></div></div>');
 await page.addStyleTag({content:await readFile(new URL('./fixtures/cpr-theme-v0.92.4.css',import.meta.url),'utf8')});
 await page.addStyleTag({content:'body{font:14px Arial;background:#333;color:#eee;margin:20px}.window-app .window-content{background:var(--cpr-background-window);color:var(--cpr-text-normal);padding:16px}#native,#native-dialog{position:absolute;left:680px;width:560px}#native{top:20px}#native-dialog{top:300px}.navtabs-right{display:flex}.items-list{padding:10px}h2{border-bottom:1px solid var(--cpr-text-header-line);color:var(--cpr-text-normal)}input,select{background:var(--cpr-background-foundry-input);color:var(--cpr-text-input);border:1px solid #888;font:inherit}input{width:65px}.dialog-item{padding:8px}.form-group{display:flex;justify-content:space-between;align-items:center;margin:8px 0}.form-fields{display:flex;align-items:center;gap:8px}.notes{font-size:12px;line-height:1.4}button{font:inherit;padding:6px;border:1px solid #888;cursor:pointer}.sheet-footer{display:flex;gap:8px}.sheet-footer button{flex:1}#pvt-theme-customizer{width:620px}'});
 await page.addStyleTag({content:await readFile(new URL('../dist/theme-customizer.css',import.meta.url),'utf8')});
 await page.evaluate(()=>{const settings=document.createElement('div');settings.id='client-settings';settings.className='window-app';settings.innerHTML='<div class="window-content"><h2>Settings</h2><input value="Native input"><button>Save Changes</button><nav><a class="tab-label active">Settings tab</a></nav><p style="color:var(--cpr-text-chat-failure)">Failure</p></div>';document.body.append(settings);});
 await page.locator('#native .window-content').evaluate(e=>e.insertAdjacentHTML('beforeend','<div class="weapon-mode"><ul><li><span>Aim</span><a data-fire-mode="aimed">O</a></li><li><span>Suppress</span><a data-fire-mode="suppressive">O</a></li></ul></div><div class="armor-1-location">Body</div><div class="armor-1-stats">11/11</div><div class="weapon-attack"><a>Attack</a></div><div class="weapon-name">Rifle</div>'));
 const settingsSnapshot=()=>page.locator('#client-settings').evaluate(e=>[e,...e.querySelectorAll('*')].map(node=>{const s=getComputedStyle(node);return [s.backgroundColor,s.color,s.borderColor,s.colorScheme];}));
 const lightSettings=await settingsSnapshot();
 await page.evaluate(()=>document.documentElement.dataset.cprTheme='darkmode');
 const darkSettings=await settingsSnapshot();
 await page.evaluate(()=>delete document.documentElement.dataset.cprTheme);
 await page.addStyleTag({content:'#client-settings button:hover{box-shadow:0 0 5px var(--color-shadow-primary)}'});
 const nativeSnapshot=()=>page.locator('#native-dialog').evaluate(e=>[e,...e.querySelectorAll('*')].map(node=>{const s=getComputedStyle(node);return [s.backgroundColor,s.color,s.borderColor,s.colorScheme];}));
 const settingsBaseline=await nativeSnapshot();
 await page.addStyleTag({content:'.skills-tab .items-list > .item:nth-child(even){background:var(--cpr-background-row-even)}.skills-tab .items-list > .item:nth-child(odd){background:var(--cpr-background-row-odd)}'});
 const before=await page.locator('#native').boundingBox();
 const baseline=await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor);
 assert.equal(baseline,'rgb(185, 2, 2)');
 // Small fixture renderer for the actual editor template, not a Foundry runtime.
 await page.evaluate(()=>{
  window.renderTemplateFixture=(template,data)=>{
   const tokens=template.split(/({{[^}]+}})/).filter(Boolean);
   const render=(start,end,context)=>{let output='';for(let i=start;i<end;i++) {
    const token=tokens[i];if(!token.startsWith('{{')){output+=token;continue;}
    const expr=token.slice(2,-2).trim();if(expr.startsWith('#')) {
     const [kind,key]=expr.slice(1).split(' ');let depth=1,j=i+1,otherwise=-1;
     for(;j<end;j++){if(tokens[j].startsWith('{{#'))depth++;if(tokens[j].startsWith('{{/'))depth--;if(depth===1&&tokens[j]==='{{else}}')otherwise=j;if(depth===0)break;}
     if(kind==='each'){for(const v of context[key]||[])output+=render(i+1,j,v);}else if(kind==='unless'?!context[key]:context[key])output+=render(i+1,otherwise<0?j:otherwise,context);else if(otherwise>=0)output+=render(otherwise+1,j,context);i=j;
    }else output+=String(context[expr]??'');
   }return output;};return render(0,tokens.length,data);
  };
  window.hooks={};window.Hooks={once:(n,f)=>hooks[n]=f,on:(n,f)=>hooks[n]=f};window.settings={};window.menus={};window.flags={alice:{},bob:{}};
  window.game={modules:new Map(),user:{id:'alice',getFlag:(m,k)=>flags[game.user.id][k],setFlag:async(m,k,v)=>{flags[game.user.id][k]=structuredClone(v);}},settings:{register:(m,k,v)=>{settings[k]=structuredClone(v.default);window.settingOptions=v;window.settingChanges??={};settingChanges[k]=v.onChange;},registerMenu:(m,k,v)=>menus[k]=v,get:(m,k)=>settings[k],set:async(m,k,v)=>{settings[k]=structuredClone(v);await settingChanges[k]?.(v);}}};
  window.foundry={utils:{mergeObject:(a,b)=>({...a,...b}),getRoute:path=>'/foundry/'+path}};
  window.FormApplication=class {
   static get defaultOptions(){return {};}
   activateListeners(){}
   render(){let host=document.getElementById('pvt-theme-customizer');if(!host){host=document.createElement('div');host.id='pvt-theme-customizer';host.className='window-app';document.body.prepend(host);}host.innerHTML='<div class="window-content">'+renderTemplateFixture(window.template,this.getData())+'</div>';this.element=[host];this.activateListeners([host]);host.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();await this._updateObject(e,Object.fromEntries(new FormData(e.target)));await this.close();});return this;}
   async close(){document.getElementById('pvt-theme-customizer')?.remove();}
  };
 });
 await page.evaluate(t=>window.template=t,await readFile(new URL('../dist/theme-customizer.hbs',import.meta.url),'utf8'));
 const sources=await Promise.all(['theme-palette','base-skins','theme-presets','theme-customizer'].map(name=>readFile(new URL(`../dist/${name}.js`,import.meta.url),'utf8')));
 await page.addScriptTag({content:sources.map(s=>s.replace(/^import .*\n/gm,'').replace(/^export /gm,'')).join('\n')+'\nregisterThemeCustomizer();hooks.ready();window.editor=new ThemeCustomizer();editor.render(true);'});

 assert.equal(await page.locator('[name="base"] option').count(),5);
 assert.equal(await page.locator('[data-picker]').count(),1,'Only primary color picker remains');
 assert.equal(await page.locator('[data-function="manual"]').count(),0);

 assert.equal(await page.evaluate(()=>menus.themeCustomizer.restricted),false);
 const surfaceSnapshot=()=>page.locator('#client-settings').evaluate(e=>[e,...e.querySelectorAll('input,button')].map(node=>{const s=getComputedStyle(node);return [s.backgroundColor,s.color];}));
 for(const {id} of BASE_SKINS){
  await page.locator('[name="base"]').selectOption(id);
  if(id==='pneuma-hub') {
   assert.deepEqual(await page.locator('#native-dialog button').evaluate(e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.color,s.borderTopColor,s.borderRadius];}),['rgb(22, 49, 61)','rgb(181, 245, 247)','rgb(84, 135, 146)','3px'],'Hub standard buttons match blue chat controls');
   await page.locator('#native-dialog .window-content').evaluate(e=>e.insertAdjacentHTML('afterbegin','<nav class="tabs"><a class="item active" data-tab="identity">Identity</a><a class="item" data-tab="resources">Resources</a></nav>'));
   const selectedTab=page.locator('#native-dialog .tabs .active');
   assert.equal(await selectedTab.evaluate(e=>getComputedStyle(e).color),'rgb(241, 206, 114)','Hub configuration selection is gold');
   assert.equal(await selectedTab.evaluate(e=>getComputedStyle(e).boxShadow),'rgb(241, 206, 114) 0px -2px 0px 0px inset','Selected tab underline does not change layout');
   await page.locator('#native-dialog [data-tab="resources"]').hover();
   assert.equal(await page.locator('#native-dialog [data-tab="resources"]').evaluate(e=>getComputedStyle(e).textShadow),'rgb(85, 220, 231) 0px 0px 8px','Hub tab hover is cyan');
   await page.locator('#native-dialog button').hover();
   assert.equal(await page.locator('#native-dialog button').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(35, 70, 83)','Hub button hover uses blue chat fill');
   assert.equal(await page.locator('#native-dialog button').evaluate(e=>getComputedStyle(e).boxShadow),'rgb(85, 220, 231) 0px 0px 6px 0px','Hub button hover is cyan');
   assert.equal(await page.locator('[name="colorEnabled"]').isDisabled(),true);
   assert.equal(await page.locator('[name="colorEnabled"]').isChecked(),false);
   assert.equal(await page.locator('[name="tintRows"]').isDisabled(),true);
   for(const name of ['colorizeButtons','colorizeGlows'])assert.equal(await page.locator('[name="'+name+'"]').isDisabled(),true);
   assert.equal(await page.locator('[data-pneuma-preset="0"]').isDisabled(),true);
   assert.equal(await page.locator('#pvt-custom-palette').count(),0);
   assert.deepEqual(await page.locator('#native .text-pill').evaluate(e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.color,s.borderTopColor];}),['rgb(37, 37, 28)','rgb(241, 206, 114)','rgb(155, 135, 79)']);
   await page.locator('#native .items-header').evaluate(e=>{e.innerHTML='<span class="item-name">Combat skills</span><span class="item-detail skill-mod-value">MOD</span><span class="item-detail skill-level">LVL</span><span class="item-detail">Base</span><span class="item-detail skill-favorite"><i class="fa-eye">Eye</i></span>';});
   assert.equal(await page.locator('#native .items-header .item-name').evaluate(e=>getComputedStyle(e).color),'rgb(181, 245, 247)');
   await page.locator('#native .window-content').evaluate(e=>e.insertAdjacentHTML('beforeend','<div class="section-name">Armor</div><div class="items-header lower-heading">Ranged</div>'));
   for(const selector of ['.section-name','.lower-heading'])assert.equal(await page.locator('#native '+selector).evaluate(e=>getComputedStyle(e).color),'rgb(181, 245, 247)','Hub lower section headings match button text');
   for(const selector of ['.skills-tab .items-header','.section-name','.lower-heading'])assert.equal(await page.locator('#native '+selector).evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(10, 18, 23)','Hub section headers retain dark backgrounds under native important rules');
   assert.equal(await page.locator('#native').evaluate(e=>getComputedStyle(e).getPropertyValue('--cpr-background-tab-underlay').trim()),'#548792','Hub diagonals use muted blue');
   for(const selector of ['.item-detail','.fa-eye']) {
    assert.equal(await page.locator('#native .items-header '+selector).first().evaluate(e=>getComputedStyle(e).color),'rgb(161, 182, 192)');
   }
   assert.equal(await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(16, 28, 35)','Hub selected sheet tab retains its dark fill');
   assert.equal(await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).boxShadow),'rgb(241, 206, 114) 0px -2px 0px 0px inset','Hub selected sheet tab matches configuration underline');
   assert.equal(await page.locator('#native .tab-label:not(.active)').evaluate(e=>getComputedStyle(e).color),'rgb(84, 135, 146)','Hub inactive sheet tabs use muted blue text');
   assert.equal(await page.locator('#native .tab-label.active .tab-highlight').evaluate(e=>getComputedStyle(e).color),'rgb(241, 206, 114)','Selected sheet tab text is gold');
   assert.equal(await page.locator('#native h2').evaluate(e=>getComputedStyle(e).borderBottomColor),'rgb(85, 220, 231)','Hub fine dividers keep cyan');
   assert.equal(await page.locator('#native').evaluate(e=>getComputedStyle(e).getPropertyValue('--cpr-background-border').trim()),'#303b40','Hub structural frames are muted');
   for(const selector of ['.item-name > a[data-roll-type="skill"]','.weapon-mode li > span','.armor-1-location']) {
    assert.equal(await page.locator('#native '+selector).first().evaluate(e=>getComputedStyle(e).color),'rgb(161, 182, 192)','Hub secondary labels use chat grey');
   }
   for(const selector of ['.skill-base','.armor-1-stats','.weapon-attack a','.weapon-name']) {
    assert.equal(await page.locator('#native '+selector).evaluate(e=>getComputedStyle(e).color),'rgb(229, 239, 241)','Hub values and primary controls stay bright');
   }
   await page.screenshot({path:'docs/base-skin-pneuma-hub-check.png'});
   continue;
  }
  await page.locator('[name="colorEnabled"]').uncheck();
  const beforeColors=await surfaceSnapshot();
  const baseButtonBorder=await page.locator('#native-dialog button').evaluate(e=>getComputedStyle(e).borderTopColor);
  const baseGlow=await page.locator('#native').evaluate(e=>getComputedStyle(e).getPropertyValue('--cpr-background-foundry-hover').trim());
  if(id==='pneuma-light') {
   for(const selector of ['.window-title','.header-button','.header-button i','.window-header button'])assert.equal(await page.locator('#native '+selector).evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)','Pneuma Light title controls stay white');
  }
  if(id==='default-light')assert.deepEqual(await settingsSnapshot(),lightSettings,'Default Light uses native CSS');
  if(id==='default-dark')assert.deepEqual(await settingsSnapshot(),darkSettings,'Default Dark uses native CSS');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.cprTheme),baseMode(id)==='dark'?'darkmode':'lightmode');
  const tabBefore=await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor);
  await page.locator('[name="colorEnabled"]').check();
  await page.locator('[data-seed]').fill('#8040c0');
  const skillLink=page.locator('#native .item-name > a[data-roll-type="skill"]');
  await skillLink.hover();
  assert.equal(await skillLink.evaluate(e=>getComputedStyle(e).textShadow),'rgb(128, 64, 192) 0px 0px 8px','Native hover glow uses exact primary and retains blur');
  await page.locator('#client-settings button').hover();
  assert.equal(await page.locator('#client-settings button').evaluate(e=>getComputedStyle(e).boxShadow),'rgb(128, 64, 192) 0px 0px 5px 0px','Settings button hover uses primary shadow');
  await page.mouse.move(0,0);
  assert.equal(await page.locator('[name="main"]').inputValue(),'#8040c0');
  assert.equal(await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(128, 64, 192)','Rendered primary is exact');
  await page.locator('[name="colorizeButtons"]').uncheck();
  assert.equal(await page.locator('#native-dialog button').evaluate(e=>getComputedStyle(e).borderTopColor),baseButtonBorder,'Button outlines restore independently');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('pvt-custom-theme')),true);
  await page.locator('[name="colorizeButtons"]').check();
  await page.locator('[name="colorizeGlows"]').uncheck();
  assert.equal(await page.locator('#native').evaluate(e=>getComputedStyle(e).getPropertyValue('--cpr-background-foundry-hover').trim()),baseGlow,'Hover color restores independently');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('pvt-colored-buttons')),true);
  await page.locator('[name="colorizeGlows"]').check();
  assert.deepEqual(await surfaceSnapshot(),beforeColors,id+' colorization cannot change settings surfaces or inputs');
  assert.notEqual(await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor),tabBefore);
  await page.locator('[name="tintRows"]').check();
  assert.deepEqual(await surfaceSnapshot(),beforeColors,id+' row tint does not change settings controls');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).getPropertyValue('--pvt-custom-main')),'');
  await page.screenshot({path:'docs/base-skin-'+id+'-check.png'});
 }

 // Recreating the base style must not cover an already enabled color layer.
 for(const id of ['default-light','pneuma-light','default-dark','pneuma-dark','pneuma-light']) {
  await page.locator('[name="base"]').selectOption(id);
  await page.locator('[name="colorEnabled"]').check();
  await page.locator('[name="tintRows"]').uncheck();
  const inspect=()=>page.locator('#native').evaluate(e=>{const s=getComputedStyle(e);return {main:s.getPropertyValue('--pvt-custom-main').trim(),border:s.getPropertyValue('--cpr-background-border').trim(),odd:s.getPropertyValue('--cpr-background-row-odd').trim(),even:s.getPropertyValue('--cpr-background-row-even').trim()};});
  const rowColors=()=>page.locator('#native .items-list > .item').evaluateAll(rows=>rows.map(e=>getComputedStyle(e).backgroundColor));
  const stockRows=await rowColors();
  const plain=await inspect();assert.equal(plain.border,plain.main,id+' accent wins after base switch');
  const button=await page.locator('#native-dialog button').evaluate(e=>{const s=getComputedStyle(e);const probe=document.createElement('span');probe.style.color=s.getPropertyValue('--pvt-custom-main');e.append(probe);const accent=getComputedStyle(probe).color;probe.remove();return {border:s.borderTopColor,accent};});
  assert.equal(button.border,button.accent,id+' visible button accent');
  await page.locator('[name="tintRows"]').check();const tinted=await inspect();
  const coloredRows=await rowColors();
  assert.equal(coloredRows[0],stockRows[0],'First row stays stock');
  assert.notEqual(coloredRows[1],stockRows[1],'Second row takes theme tint');
  assert.equal(coloredRows[2],stockRows[2],'Third row stays stock');
  assert.notEqual(tinted.odd,plain.odd);assert.equal(tinted.even,plain.even,'Even row stays stock');
  assert.equal(tinted.main,plain.main,'Row tint does not change accents');
  await page.locator('[name="tintRows"]').uncheck();assert.deepEqual(await inspect(),plain,'Row tint off restores base rows');
 }
 await page.locator('[data-cancel]').click();
 assert.equal(await page.locator('#pvt-base-palette').count(),0);
 assert.equal(await page.locator('#pvt-custom-palette').count(),0);
 assert.deepEqual(await settingsSnapshot(),lightSettings,'Cancel restores original native mode and appearance');
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('[name="base"]').selectOption('pneuma-dark');
 await page.locator('[name="colorEnabled"]').uncheck();
 await page.locator('button[type="submit"]').click();
 assert.equal(await page.evaluate(()=>settings.customTheme.base),'pneuma-dark');
 assert.equal(await page.evaluate(()=>settings.customTheme.enabled),false,'Base applies without colorization');
 assert.equal(await page.locator('#pvt-base-palette').count(),1);
 assert.equal(await page.locator('#pvt-custom-palette').count(),0);
 const saved=await surfaceSnapshot();
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('[name="base"]').selectOption('pneuma-light');
 await page.locator('[name="colorEnabled"]').check();
 await page.locator('[data-pneuma-preset="1"]').click();
 assert.equal(await page.locator('[name="base"]').inputValue(),'pneuma-light','Color preset preserves base');
 await page.locator('[data-preset-name="0"]').fill('Hub Cyan');await page.locator('[data-save-preset="0"]').click();
 await page.waitForFunction(()=>flags.alice.themePresets?.[0]?.name==='Hub Cyan');
 assert.equal(await page.evaluate(()=>settings.customTheme.base),'pneuma-dark','Saving preset does not apply');
 await page.locator('[data-cancel]').click();assert.deepEqual(await surfaceSnapshot(),saved);
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('[name="colorEnabled"]').check();
 await page.locator('[data-load-preset="0"]').first().click();
 assert.equal(await page.locator('[name="base"]').inputValue(),'pneuma-dark');
 await page.locator('button[type="submit"]').click();
 assert.equal(await page.evaluate(()=>settings.customTheme.enabled),true);
 const retainedTheme=await page.evaluate(()=>structuredClone(settings.customTheme));
 await page.evaluate(()=>game.settings.set('pneuma-visualtools','visualSkinningEnabled',false));
 assert.equal(await page.locator('#pvt-custom-palette').count(),0);
 assert.equal(await page.locator('#pvt-base-palette').count(),0,'Master switch removes base styling');
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.pvtBase),undefined);
 assert.deepEqual(await page.evaluate(()=>settings.customTheme),retainedTheme,'Master off preserves all saved choices');
 await page.evaluate(()=>game.settings.set('pneuma-visualtools','visualSkinningEnabled',true));
 assert.equal(await page.locator('#pvt-base-palette').count(),1);
 assert.equal(await page.locator('#pvt-custom-palette').count(),1);
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('[name="colorEnabled"]').check();
 await page.locator('[name="colorizeButtons"]').uncheck();await page.locator('[name="colorizeGlows"]').uncheck();
 await page.locator('button[type="submit"]').click();
 assert.equal(await page.evaluate(()=>settings.customTheme.colorizeButtons),false);assert.equal(await page.evaluate(()=>settings.customTheme.colorizeGlows),false);
 await page.evaluate(()=>{game.user.id='bob';window.editor=new ThemeCustomizer();editor.render(true);});
 assert.equal(await page.locator('.pvt-preset-swatch[disabled]').count(),3,'Presets isolated by player');
 await page.evaluate(()=>editor.close());
 await page.evaluate(async()=>{await game.settings.set('pneuma-visualtools','customTheme',{...settings.customTheme,base:'pneuma-hub',enabled:true,tintRows:true});await game.settings.set('pneuma-visualtools','visualSkinningEnabled',true);});
 assert.equal(await page.locator('#pvt-custom-palette').count(),0,'Hub rejects stale/forced color settings');
 assert.equal(await page.evaluate(()=>settings.visualSkinningEnabled),true);
 await page.evaluate(()=>game.settings.set('pneuma-visualtools','visualSkinningEnabled',false));
 assert.equal(await page.locator('#pvt-base-palette').count(),0,'Master disables fixed Hub too');
 await page.evaluate(()=>game.settings.set('pneuma-visualtools','visualSkinningEnabled',true));
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.pvtBase),'pneuma-hub');
 assert.equal(await page.locator('#pvt-custom-palette').count(),0,'Restoring Hub does not enable colorization');
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('pvt-tinted-rows')),false);
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('button[type="submit"]').click();
 assert.equal(await page.evaluate(()=>settings.customTheme.enabled),false,'Hub saves with colorization disabled');
 // Independent Full Custom palettes reproduce a yellow/cyan player theme.
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('[name="base"]').selectOption('pneuma-dark');
 await page.locator('[name="colorEnabled"]').check();
 await page.locator('[name="method"]').selectOption('manual');
 assert.equal(await page.locator('[name="main"]').count(),0,'Primary is absent in Full Custom');
 for(const [role,color] of Object.entries({main:'#ffff00',bright:'#ffff00',pale:'#000000',headerText:'#00ffff',headerBackground:'#101010',badgeBackground:'#00ffff',badgeText:'#000000',inactiveTabText:'#000000',odd:'#191919',even:'#222222'})) {
   await page.locator('[name="custom-dark-'+role+'"]').fill(color);
 }
 await page.locator('[name="tintRows"]').check();
 assert.equal(await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 0)');
 assert.equal(await page.locator('#native .text-pill').evaluate(e=>getComputedStyle(e).color),'rgb(0, 0, 0)');
 assert.equal(await page.locator('#native').evaluate(e=>getComputedStyle(e).getPropertyValue('--cpr-background-pill').trim()),'#00ffff');
 assert.equal(await page.locator('#native').evaluate(e=>getComputedStyle(e).getPropertyValue('--cpr-text-header').trim()),'#00ffff');
 await page.locator('[name="method"]').selectOption('simple');
 await page.locator('[name="main"]').fill('#ff0000');
 await page.locator('[name="method"]').selectOption('manual');
 assert.equal(await page.locator('[name="custom-dark-main"]').inputValue(),'#ffff00','Primary edits preserve custom palette');
 await page.locator('.pvt-advanced summary').click();
 await page.locator('[data-save-preset="0"]').click();
 await page.waitForFunction(()=>flags.bob.themePresets?.[0]?.theme.method==='manual');
 assert.equal(await page.evaluate(()=>flags.bob.themePresets[0].theme.seed),'#ff0000');
 assert.equal(await page.evaluate(()=>flags.bob.themePresets[0].theme.dark.headerText),'#00ffff');
 await page.locator('button[type="submit"]').click();
 assert.equal(await page.evaluate(()=>settings.customTheme.method),'manual');
 assert.equal(await page.evaluate(()=>settings.customTheme.seed),'#ff0000');
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 assert.equal(await page.locator('[name="custom-dark-badgeBackground"]').inputValue(),'#00ffff');
 await page.locator('[name="method"]').selectOption('simple');
 assert.equal(await page.locator('[name="main"]').inputValue(),'#ff0000');
 await page.locator('[data-load-preset="0"]').first().click();
 assert.equal(await page.locator('[name="method"]').inputValue(),'manual');
 assert.equal(await page.locator('[name="custom-dark-headerText"]').inputValue(),'#00ffff');
 await page.locator('[name="base"]').selectOption('pneuma-hub');
 assert.equal(await page.locator('[name="method"]').isDisabled(),true);
 assert.equal(await page.locator('#pvt-custom-palette').count(),0);
 await page.locator('[data-cancel]').click();
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.pvtBase),'pneuma-dark','Cancel restores saved custom theme');
 console.log('Theme checks passed: fixed Hub palette and GM-style stat pills, five bases, native defaults, independent colorization, adapted contrast, settings surface preservation, row tint, Apply/Cancel, presets and player isolation.');
}finally{await browser.close();}
