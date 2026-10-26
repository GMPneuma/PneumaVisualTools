import {BASE_SKINS, baseMode, normalizeBase, baseVariables, adaptPalette, baseContrastWarnings} from './base-skins.js';
import {DEFAULT_THEME, normalizeTheme, generatePalette, paletteVariables, type CustomTheme, type ThemeMode} from './theme-palette.js';
import {PNEUMA_PRESETS,normalizePersonalPresets,type ThemePreset} from './theme-presets.js';
declare global {interface SettingConfig {'pneuma-visualtools.customTheme': CustomTheme; 'pneuma-visualtools.visualSkinningEnabled': boolean}}
declare global {interface FlagConfig {User:{'pneuma-visualtools':{themePresets:(ThemePreset|null)[]}}}}
const MODULE = 'pneuma-visualtools';
let nativeTheme: string | null | undefined;
let activeMode: ThemeMode | undefined;
let liveDraft:{owner:ThemeCustomizer;theme:CustomTheme;mode:ThemeMode}|undefined;
export function effectiveThemeMode(theme: CustomTheme): ThemeMode {
  if (theme.base) return baseMode(theme.base);
  if (theme.mode !== 'automatic') return theme.mode;
  return document.documentElement.dataset.cprTheme === 'darkmode' || document.body.classList.contains('theme-dark') ? 'dark' : 'light';
}
export function applyCustomTheme(): void {
  const theme=normalizeTheme(liveDraft?.theme??game.settings!.get(MODULE,'customTheme'));
  if(!liveDraft && !game.settings!.get(MODULE,'visualSkinningEnabled')) {theme.base=null;theme.enabled=false;}
  const root=document.documentElement;
  if(theme.base) {
    if(nativeTheme===undefined)nativeTheme=root.getAttribute('data-cpr-theme');
    const mode=baseMode(theme.base)==='dark'?'darkmode':'lightmode';
    if(root.dataset.cprTheme!==mode)root.dataset.cprTheme=mode;
    root.dataset.pvtBase=theme.base;
  } else {
    delete root.dataset.pvtBase;
    if(nativeTheme!==undefined){if(nativeTheme===null)root.removeAttribute('data-cpr-theme');else root.setAttribute('data-cpr-theme',nativeTheme);nativeTheme=undefined;}
  }
  root.classList.toggle('pvt-custom-theme',theme.enabled);
  root.classList.toggle('pvt-tinted-rows',theme.enabled && theme.tintRows);
  root.classList.toggle('pvt-colored-buttons',theme.enabled && theme.colorizeButtons);
  const writeStyle=(id:string,css:string):void=>{
    let style=document.getElementById(id);
    if(!css){style?.remove();return;}
    if(!style){style=document.createElement('style');style.id=id;document.head.append(style);}
    style.textContent=css;
    // Reinsert in base-then-color order even when a base style was recreated.
    document.head.append(style);
  };
  const declarations=(vars:Record<string,string>)=>Object.entries(vars).map(([key,value])=>key+':'+value+';').join('');
  const scope=':is(.window-app, .application, .pneuma-theme-technical)';
  const base=theme.base;
  const baseCSS=base?declarations(baseVariables(base)):'';
  writeStyle('pvt-base-palette',baseCSS?'html[data-pvt-base] '+scope+' {'+baseCSS+'}':'');
  activeMode=effectiveThemeMode(theme);
  const effectiveBase=base??(activeMode==='dark'?'default-dark':'default-light');
  const palette=adaptPalette(theme[activeMode],effectiveBase);
  writeStyle('pvt-custom-palette',theme.enabled?'html.pvt-custom-theme '+scope+' {'+declarations(paletteVariables(palette,activeMode,theme.tintRows,theme.colorizeGlows))+'}':'');

}
export class ThemeCustomizer extends FormApplication {
  private draft: CustomTheme;
  private editing: ThemeMode;
  constructor() {
    super({});
    this.draft=normalizeTheme(game.settings!.get(MODULE,'customTheme'));
    this.editing=effectiveThemeMode(this.draft);
  }
  static override get defaultOptions(): FormApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions,{
      id:'pvt-theme-customizer',title:'Visual skinning',width:620,height:'auto',
      template:foundry.utils.getRoute(`modules/${MODULE}/theme-customizer.hbs`),closeOnSubmit:true,submitOnChange:false,submitOnClose:false,
    });
  }
  override getData() {
    return {colorsDisabled:this.draft.base==='pneuma-hub'||!this.draft.enabled,light:this.editing==='light',dark:this.editing==='dark',
      hardTheme:this.draft.base==='pneuma-hub',colorEnabled:this.draft.base!=='pneuma-hub'&&this.draft.enabled,tintRows:this.draft.tintRows,colorizeButtons:this.draft.colorizeButtons,colorizeGlows:this.draft.colorizeGlows,
      bases:BASE_SKINS.map(b=>({...b,selected:b.id===(this.draft.base??(this.editing==='dark'?'default-dark':'default-light'))})),
      modes:[{id:'light',label:'Light'},{id:'dark',label:'Dark'}].map(m=>({...m,selected:m.id===this.editing})),
      mainAccent:this.draft.seed,
      legacyActive:game.modules?.get('pneuma-green-theme')?.active,
      pneumaPresets:PNEUMA_PRESETS.map((preset,index)=>({index,name:preset.name})),
      personalPresets:normalizePersonalPresets(game.user?.getFlag(MODULE,'themePresets')).map((preset,index)=>({index,slot:index+1,name:preset?.name||`My theme ${index+1}`,empty:!preset,accent:preset?.theme.seed??'transparent'})),
    };
  }
  private readDraft(root: HTMLElement): void {
    this.draft.colorizeButtons=root.querySelector<HTMLInputElement>('[name="colorizeButtons"]')?.checked===true;
    this.draft.colorizeGlows=root.querySelector<HTMLInputElement>('[name="colorizeGlows"]')?.checked===true;
    this.draft.tintRows=root.querySelector<HTMLInputElement>('[name="tintRows"]')?.checked === true;
    this.draft.base=normalizeBase(root.querySelector<HTMLSelectElement>('[name="base"]')?.value);
    this.draft.enabled=this.draft.base!=='pneuma-hub'&&root.querySelector<HTMLInputElement>('[name="colorEnabled"]')?.checked===true;
    const primary=root.querySelector<HTMLInputElement>('[name="main"]')?.value;
    if(primary && /^#[0-9a-f]{6}$/i.test(primary)) {
      this.draft.seed=primary.toLowerCase();
      this.draft.light=generatePalette(this.draft.seed,'light');
      this.draft.dark=generatePalette(this.draft.seed,'dark');
    }
  }
  private preview(root: HTMLElement): void {
    liveDraft={owner:this,theme:structuredClone(this.draft),mode:this.editing};applyCustomTheme();
    const base=this.draft.base??(this.editing==='dark'?'default-dark':'default-light');
    if(base==='pneuma-hub'){root.querySelector<HTMLElement>('[data-status]')!.textContent='Hub uses fixed colors.';return;}
    if(!this.draft.enabled){root.querySelector<HTMLElement>('[data-status]')!.textContent='';return;}
    const warnings=baseContrastWarnings(adaptPalette(this.draft[this.editing],base),base,this.draft.tintRows);
    const status=root.querySelector<HTMLElement>('[data-status]')!;
    status.textContent=warnings.length ? `Low contrast: ${warnings.join('; ')}. Adjust these colors if text or controls are hard to read.` : '';
  }
  override activateListeners(html: JQuery): void {
    super.activateListeners(html);
    const root=html[0]; if (!root) return;
    this.preview(root);
    root.querySelectorAll('[name="tintRows"],[name="colorizeButtons"],[name="colorizeGlows"]').forEach(input=>input.addEventListener('change',()=>{this.readDraft(root);this.preview(root);}));
    root.querySelector<HTMLInputElement>('[name="colorEnabled"]')?.addEventListener('change',()=>{this.readDraft(root);this.editing=effectiveThemeMode(this.draft);this.render(false);});
    root.querySelector<HTMLSelectElement>('[name="base"]')?.addEventListener('change',()=>{
      this.readDraft(root);this.editing=effectiveThemeMode(this.draft);this.render(false);
    });
    root.querySelectorAll<HTMLElement>('[data-pneuma-preset]').forEach(button=>button.addEventListener('click',()=>{
      this.readDraft(root);const preset=PNEUMA_PRESETS[Number(button.dataset.pneumaPreset)];if(preset)this.loadPreset(preset.theme);
    }));
    root.querySelectorAll<HTMLElement>('[data-load-preset]').forEach(button=>button.addEventListener('click',()=>{
      this.readDraft(root);const preset=normalizePersonalPresets(game.user?.getFlag(MODULE,'themePresets'))[Number(button.dataset.loadPreset)];if(preset)this.loadPreset(preset.theme);
    }));
    root.querySelectorAll<HTMLElement>('[data-save-preset]').forEach(button=>button.addEventListener('click',async()=>{
      if (!form?.reportValidity()) return;
      this.readDraft(root);const index=Number(button.dataset.savePreset);
      const slots=normalizePersonalPresets(game.user?.getFlag(MODULE,'themePresets'));
      slots[index]={name:root.querySelector<HTMLInputElement>(`[data-preset-name="${index}"]`)!.value.trim().slice(0,32)||`My theme ${index+1}`,theme:structuredClone(this.draft)};
      try {await game.user!.setFlag(MODULE,'themePresets',slots);this.render(false);} catch(error){root.querySelector('[data-status]')!.textContent=`Could not save preset: ${String(error)}`;}
    }));
    const form=root.matches('form') ? root as HTMLFormElement : root.querySelector<HTMLFormElement>('form');
    root.querySelectorAll<HTMLInputElement>('[data-picker]').forEach(picker=>picker.addEventListener('input',()=>{
      root.querySelector<HTMLInputElement>(`[name="${picker.dataset.picker}"]`)!.value=picker.value;
      this.readDraft(root);
      this.preview(root);
    }));
    root.querySelectorAll<HTMLInputElement>('[data-hex]').forEach(input=>input.addEventListener('input',()=>{
      if (/^#[0-9a-f]{6}$/i.test(input.value)) {
        root.querySelector<HTMLInputElement>(`[data-picker="${input.name}"]`)!.value=input.value;
        this.readDraft(root);
        this.preview(root);
      }
    }));
    root.querySelector('[data-cancel]')?.addEventListener('click',()=>{void this.close();});
  }
  private loadPreset(theme:CustomTheme):void {
    if(this.draft.base==='pneuma-hub')return;
    const base=this.draft.base;this.draft=normalizeTheme(theme);this.draft.base=base;this.draft.enabled=true;
    this.render(false);
  }
  override async close(options?:FormApplication.CloseOptions):Promise<void> {
    if(liveDraft?.owner===this){liveDraft=undefined;applyCustomTheme();}
    await super.close(options);
  }
  protected override async _updateObject(_event: Event, data: Record<string,unknown>): Promise<void> {
    const next=structuredClone(this.draft);
    if(data.colorEnabled && data.base!=='pneuma-hub') {
      const primary=String(data.main);
      if(!/^#[0-9a-f]{6}$/i.test(primary))throw Error('Use a six-digit hex color, such as #4d771f.');
      next.seed=primary.toLowerCase();
    }
    next.method='simple';
    // Base and colorization are saved independently.
    next.enabled=Boolean(data.colorEnabled);
    if(data.colorEnabled && data.base!=='pneuma-hub'){next.tintRows=Boolean(data.tintRows);next.colorizeButtons=Boolean(data.colorizeButtons);next.colorizeGlows=Boolean(data.colorizeGlows);}
    next.base=normalizeBase(data.base);
    next.mode='automatic';
    await game.settings!.set(MODULE,'customTheme',normalizeTheme(next));
    if(liveDraft?.owner===this) liveDraft=undefined;
    applyCustomTheme();
  }
}
export function registerThemeCustomizer(): void {
  const link=document.createElement('link');link.rel='stylesheet';link.href=foundry.utils.getRoute(`modules/${MODULE}/theme-customizer.css`);document.head.append(link);
  game.settings!.register(MODULE,'customTheme',{name:'Custom color theme',scope:'client',config:false,type:Object,default:structuredClone(DEFAULT_THEME),onChange:async(theme:CustomTheme)=>{
    const saved=normalizeTheme(theme);
    await game.settings!.set(MODULE,'visualSkinningEnabled',Boolean(saved.base||saved.enabled));
    applyCustomTheme();
  }});
  // A new key avoids inheriting the old colorization-only switch's false value
  // when a saved base (especially fixed-color Hub) is already active.
  const saved=normalizeTheme(game.settings!.get(MODULE,'customTheme'));
  game.settings!.register(MODULE,'visualSkinningEnabled',{name:'Enable visual skinning',hint:'Apply your saved base skin and colorization. Turning this off preserves your skin, colors and presets.',scope:'client',config:true,type:Boolean,default:Boolean(saved.base||saved.enabled),onChange:()=>{liveDraft=undefined;applyCustomTheme();}});
  game.settings!.registerMenu(MODULE,'themeCustomizer',{name:'Visual skinning',label:'Base and colors',hint:'Choose a base skin and optional colorization independently.',icon:'fas fa-palette',type:ThemeCustomizer,restricted:false});
  Hooks.once('ready',()=>{
    applyCustomTheme();
    const observer=new MutationObserver(()=>{
      if(liveDraft || !game.settings!.get(MODULE,'visualSkinningEnabled')) return;
      const theme=normalizeTheme(game.settings!.get(MODULE,'customTheme'));
      if ((theme.enabled || theme.base) && (effectiveThemeMode(theme)!==activeMode || (theme.base && document.documentElement.dataset.cprTheme!==(baseMode(theme.base)==='dark'?'darkmode':'lightmode')))) applyCustomTheme();
    });
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-cpr-theme']});
    observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  });
}

