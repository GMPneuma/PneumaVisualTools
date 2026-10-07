import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
import {DEFAULT_THEME,generatePalette,contrastWarnings,normalizeTheme,paletteVariables} from '../dist/theme-palette.js';
import {PNEUMA_PRESETS,normalizePersonalPresets} from '../dist/theme-presets.js';
for(const mode of ['light','dark']) for(const seed of ['#ffff00','#0000ff','#ff00ff','#00ffff','#ff0000','#ffffff','#000000','#888888']) {
 const p=generatePalette(seed,mode);assert.deepEqual(contrastWarnings(p,mode),[],`${mode} ${seed}`);
 assert.equal(paletteVariables(p,mode)['--pgt-surface-2'],paletteVariables(DEFAULT_THEME[mode],mode)['--pgt-surface-2']);
 assert.notEqual(paletteVariables(p,mode)['--cpr-text-chat-failure'],p.main);
}
assert.equal(normalizeTheme({light:{main:'red; background:url(bad)'}}).light.main,DEFAULT_THEME.light.main);
assert.equal(PNEUMA_PRESETS.length,3);assert.equal(normalizePersonalPresets([]).length,3);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1300,height:950}});
 await page.setContent('<div id="native" class="sheet window-app"><div class="window-content"><h2>Existing sheet</h2><nav class="navtabs-right"><a class="tab-label active"><span class="tab-highlight">Skills</span></a><a class="tab-label">Gear</a></nav><div class="skills-tab"><ol class="items-list"><li class="items-header">Combat skills</li><li class="item"><span class="text-pill">REF</span><input class="skill-input" value="6"></li></ol></div></div></div><div id="native-dialog" class="window-app"><div class="window-content"><form class="dialog-sheet"><h2>Existing roll dialog</h2><div class="dialog-item flexrow">REF <input type="number" value="8"></div><div class="dialog-item flexrow">Handgun <input type="number" value="6"></div><div class="dialog-footer"><button class="cpr-dialog-button" type="button">Confirm</button></div></form></div></div>');
 await page.addStyleTag({content:await readFile(new URL('./fixtures/cpr-theme-v0.92.4.css',import.meta.url),'utf8')});
 await page.addStyleTag({content:'body{font:14px Arial;background:#333;color:#eee;margin:20px}.window-app .window-content{background:var(--cpr-background-window);color:var(--cpr-text-normal);padding:16px}#native,#native-dialog{position:absolute;left:680px;width:560px}#native{top:20px}#native-dialog{top:300px}.navtabs-right{display:flex}.items-list{padding:10px}h2{border-bottom:1px solid var(--cpr-text-header-line);color:var(--cpr-text-normal)}input,select{background:var(--cpr-background-foundry-input);color:var(--cpr-text-input);border:1px solid #888;font:inherit}input{width:65px}.dialog-item{padding:8px}.form-group{display:flex;justify-content:space-between;align-items:center;margin:8px 0}.form-fields{display:flex;align-items:center;gap:8px}.notes{font-size:12px;line-height:1.4}button{font:inherit;padding:6px;border:1px solid #888;cursor:pointer}.sheet-footer{display:flex;gap:8px}.sheet-footer button{flex:1}#pvt-theme-customizer{width:620px}'});
 await page.addStyleTag({content:await readFile(new URL('../dist/theme-customizer.css',import.meta.url),'utf8')});
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
  window.hooks={};window.Hooks={once:(n,f)=>hooks[n]=f};window.settings={};window.menus={};window.flags={alice:{},bob:{}};
  window.game={modules:new Map(),user:{id:'alice',getFlag:(m,k)=>flags[game.user.id][k],setFlag:async(m,k,v)=>{flags[game.user.id][k]=structuredClone(v);}},settings:{register:(m,k,v)=>{settings[k]=structuredClone(v.default);window.settingOptions=v;window.settingChange=v.onChange;},registerMenu:(m,k,v)=>menus[k]=v,get:(m,k)=>settings[k],set:async(m,k,v)=>{settings[k]=structuredClone(v);settingChange();}}};
  window.foundry={utils:{mergeObject:(a,b)=>({...a,...b}),getRoute:path=>'/foundry/'+path}};
  window.FormApplication=class {
   static get defaultOptions(){return {};}
   activateListeners(){}
   render(){let host=document.getElementById('pvt-theme-customizer');if(!host){host=document.createElement('div');host.id='pvt-theme-customizer';document.body.prepend(host);}host.innerHTML='<div class="window-content">'+renderTemplateFixture(window.template,this.getData())+'</div>';this.element=[host];this.activateListeners([host]);host.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();await this._updateObject(e,Object.fromEntries(new FormData(e.target)));await this.close();});return this;}
   async close(){document.getElementById('pvt-theme-customizer')?.remove();}
  };
 });
 await page.evaluate(t=>window.template=t,await readFile(new URL('../dist/theme-customizer.hbs',import.meta.url),'utf8'));
 const sources=await Promise.all(['theme-palette','theme-presets','theme-customizer'].map(name=>readFile(new URL(`../dist/${name}.js`,import.meta.url),'utf8')));
 await page.addScriptTag({content:sources.map(s=>s.replace(/^import .*\n/gm,'').replace(/^export /gm,'')).join('\n')+'\nregisterThemeCustomizer();hooks.ready();window.editor=new ThemeCustomizer();editor.render(true);'});
 assert.equal(await page.evaluate(()=>settingOptions.scope),'client');assert.equal(await page.evaluate(()=>menus.themeCustomizer.restricted),false);
 assert.equal(await page.locator('[data-pneuma-preset]').count(),3);
 await page.locator('details').evaluate(e=>e.open=true);
 assert.equal(await page.locator('[data-save-preset]').count(),3);
 assert.equal(await page.evaluate(()=>settings.customTheme.enabled),false);
 assert.notEqual(await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor),baseline,'Existing native tab recolors immediately');
 await page.locator('[data-seed]').fill('#a030dc');
 const purple=await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor);
 assert.equal(await page.locator('#native h2').evaluate(e=>getComputedStyle(e).borderBottomColor),purple,'Root-derived divider alias recolors');
 assert.deepEqual(await page.locator('#native').boundingBox(),before,'Native geometry unchanged');
 await page.locator('details').evaluate(e=>e.open=true);
 await page.locator('[data-preset-name="0"]').fill('Purple');await page.locator('[data-save-preset="0"]').click();
 await page.waitForFunction(()=>flags.alice.themePresets?.[0]?.name==='Purple');
 assert.equal(await page.evaluate(()=>settings.customTheme.enabled),false,'Saving a slot does not apply');
 await page.locator('[data-cancel]').click();
 assert.equal(await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor),baseline,'Cancel restores native theme');
 assert.equal(await page.locator('#pvt-custom-palette').count(),0);
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('[data-pneuma-preset="1"]').click();
 await page.locator('[data-function="manual"]').click();assert.equal(await page.locator('[data-picker]').count(),8);
 await page.locator('[name="main"]').fill('#234567');
 await page.locator('[data-edit-mode="dark"]').click();await page.locator('[name="name"]').fill('#ffdd00');
 await page.locator('[data-edit-mode="light"]').click();assert.equal(await page.locator('[name="main"]').inputValue(),'#234567');
 await page.locator('[data-edit-mode="dark"]').click();assert.equal(await page.locator('[name="name"]').inputValue(),'#ffdd00');
 await page.locator('[name="mode"]').selectOption('dark');
 await page.locator('button[type="submit"]').click();
 assert.equal(await page.evaluate(()=>settings.customTheme.enabled),true,'Apply works without a separate enable checkbox');
 assert.equal(await page.evaluate(()=>settings.customTheme.light.main),'#234567');assert.equal(await page.evaluate(()=>settings.customTheme.dark.name),'#ffdd00');
 const saved=await page.evaluate(()=>structuredClone(settings.customTheme));
 const savedTab=await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor);
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('[name="main"]').fill('#ff9900');await page.evaluate(()=>editor.close());
 assert.equal(await page.locator('#native .tab-label.active').evaluate(e=>getComputedStyle(e).backgroundColor),savedTab,'Window close restores saved custom colors');
 assert.deepEqual(await page.evaluate(()=>settings.customTheme),saved);
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 for(const index of [1,2]){
  await page.locator('details').evaluate(e=>e.open=true);await page.locator(`[data-preset-name="${index}"]`).fill(`Personal ${index+1}`);await page.locator(`[data-save-preset="${index}"]`).click();await page.waitForFunction(i=>Boolean(flags.alice.themePresets[i]),index);
 }
 await page.locator('details').evaluate(e=>e.open=true);await page.locator('[data-load-preset="0"]').click();
 assert.equal(await page.locator('[data-seed]').inputValue(),'#a030dc');
 await page.locator('details').evaluate(e=>e.open=true);
 await page.screenshot({path:new URL('../docs/theme-customizer-live-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
 await page.evaluate(()=>editor.close());
 assert.equal(await page.evaluate(()=>flags.alice.themePresets.filter(Boolean).length),3);
 await page.evaluate(()=>{game.user.id='bob';window.editor=new ThemeCustomizer();editor.render(true);});
 assert.equal(await page.locator('[data-load-preset][disabled]').count(),3,'Personal slots are isolated by player');
 await page.evaluate(()=>editor.close());
 assert.equal(await page.evaluate(()=>flags.alice.themePresets[0].name),'Purple');
 await page.evaluate(()=>{settings.customTheme.mode='automatic';applyCustomTheme();document.documentElement.dataset.cprTheme='darkmode';});
 await page.waitForFunction(()=>getComputedStyle(document.body).getPropertyValue('--pgt-surface-3').trim()==='#151515');
 await page.evaluate(()=>delete document.documentElement.dataset.cprTheme);
 await page.waitForFunction(()=>getComputedStyle(document.body).getPropertyValue('--pgt-surface-3').trim()==='#cccccc');
 await page.evaluate(()=>{window.editor=new ThemeCustomizer();editor.render(true);});
 await page.locator('[data-disable-theme]').click();await page.waitForFunction(()=>settings.customTheme.enabled===false);
 assert.equal(await page.locator('#pvt-custom-palette').count(),0);await page.evaluate(()=>editor.close());
 console.log('Theme checks passed: live native CSS recolor, root aliases, unchanged geometry, Apply activation, Cancel/window-close restoration, light/dark palettes, three built-ins, three personal slots and player isolation.');
}finally{await browser.close();}
