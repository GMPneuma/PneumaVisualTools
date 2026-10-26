import {contrast, onColor, type Palette, type ThemeMode} from './theme-palette.js';
export const BASE_SKINS = [
  {id:'default-dark',label:'Dark',mode:'dark'},
  {id:'default-light',label:'Light',mode:'light'},
  {id:'pneuma-dark',label:'Pneuma Dark',mode:'dark'},
  {id:'pneuma-light',label:'Pneuma Light',mode:'light'},
  {id:'pneuma-hub',label:'Pneuma Hub',mode:'dark'},
] as const;
export type BaseSkin = typeof BASE_SKINS[number]['id'];
export function normalizeBase(value:unknown):BaseSkin|null {return BASE_SKINS.find(b=>b.id===value)?.id??null;}
export function baseMode(base:BaseSkin):ThemeMode {return BASE_SKINS.find(b=>b.id===base)!.mode;}
// Default profiles are reference surfaces for accent fitting only. Native CPR
// owns their rendered appearance. Hub values match chat-hub.css.
export const BASE_SURFACES = {
  'default-light':{window:'#eaeaea',panel:'#eaeaea',input:'#eaeaea',row:'#ffc3b6',text:'#0d0b0c',muted:'#444444',border:'#9e9f9f',accent:'#b90202',header:'#0d0b0c',highlight:'#ffffff'},
  'pneuma-light':{window:'#d4d4d4',panel:'#cccccc',input:'#e0e0e0',row:'#c3c3c3',text:'#202020',muted:'#505050',border:'#808080',accent:'#535353',header:'#333333',highlight:'#eeeeee'},
  'default-dark':{window:'#232b2b',panel:'#3b444b',input:'#454b50',row:'#232b2b',text:'#eaeaea',muted:'#c0c0c0',border:'#666666',accent:'#52606d',header:'#121212',highlight:'#eaeaea'},
  'pneuma-dark':{window:'#222222',panel:'#2b2b2b',input:'#363636',row:'#303030',text:'#e8e8e8',muted:'#b8b8b8',border:'#686868',accent:'#909090',header:'#181818',highlight:'#eeeeee'},
  'pneuma-hub':{window:'#0c141a',panel:'#101e26',input:'#16313d',row:'#152a33',text:'#e5eff1',muted:'#a1b6c0',border:'#548792',accent:'#55dce7',header:'#101c23',highlight:'#f1ce72'},
} as const;
function baseRows(base:BaseSkin):{odd:string;even:string} {
  const n=BASE_SURFACES[base];
  return base==='pneuma-dark'?{odd:'#242424',even:'#3c3c3c'}:{odd:n.row,even:n.panel};
}
export function baseVariables(base:BaseSkin):Record<string,string> {
  if(base.startsWith('default-')) return {};
  const n=BASE_SURFACES[base], v:Record<string,string>={};
  for(const [key,value] of Object.entries(n)) v['--pvt-base-'+key]=value;
  const groups:[string,string[]][]=[
    [n.window,['background-window','background-box','background-chat-card']],
    [n.panel,['background-foundry-button','background-chat-card-block-before','background-row-even','background-content-link']],
    [n.input,['background-foundry-input','background-editor-button','background-editor-button-active']],
    [n.row,['background-row-odd','background-dialog-selected','background-cyberdeck-section-header','background-editor-button-selected','background-journal-blockquote']],
    [n.text,['text-normal','text-window','text-input','text-foundry-input','text-chat-normal','text-icon-normal','text-mook-normal','text-editor-button']],
    [n.muted,['text-hint','text-foundry-hint','text-icon-dimmed']],
    [n.header,['background-header','background-pill','background-tab-inactive','background-editor-header','background-dialog-hr-gradient-start','background-dialog-hr-gradient-end']],
    [n.highlight,['text-header','text-pill','text-tab-normal','text-editor-header']],
    [n.accent,['background-border','background-tab-active','background-dialog-border','text-header-line','text-header-arrow','background-toggle-checked','text-icon-highlight','text-foundry-hover','background-tab-underlay','background-dialog-hr-gradient-middle']],
  ];
  for(const [value,keys] of groups) for(const key of keys) v['--cpr-'+key]=value;
  const rows=baseRows(base);
  v['--cpr-background-row-odd']=rows.odd;
  v['--cpr-background-row-even']=rows.even;
  if(base==='pneuma-dark'){
    v['--pvt-base-button']='#414141';
    v['--pvt-base-button-border']='#999999';
    v['--cpr-background-foundry-button']='#414141';
  }
  v['--cpr-text-tab-highlight']=n.highlight;
  v['--cpr-text-chat-success']=base==='pneuma-light'?'#287a35':base==='pneuma-hub'?'#20ee79':'#64d98b';
  v['--cpr-text-chat-failure']=base==='pneuma-light'?'#b71924':base==='pneuma-hub'?'#ff354d':'#ff5b6f';
  v['--pvt-base-on-accent']=onColor(n.accent);
  if(base==='pneuma-hub') {
    v['--pvt-base-button']='#16313d';
    v['--pvt-base-button-ink']='#b5f5f7';
    v['--pvt-base-button-border']='#548792';
    v['--cpr-background-foundry-button']='#16313d';
    // Muted frames and inactive labels leave gold for the selected sheet tab.
    v['--cpr-background-border']='#303b40';
    v['--cpr-background-tab-active']=n.header;
    v['--cpr-text-tab-normal']=n.border;
    v['--cpr-text-tab-highlight']=n.border;
    v['--cpr-background-tab-underlay']=n.border;
    v['--pvt-base-on-accent']=n.highlight;
    v['--color-shadow-primary']=n.accent;
    v['--color-shadow-highlight']=n.accent;
    v['--cpr-background-foundry-hover']=n.accent;
  }
  v['--color-text-dark-primary']=n.text;v['--color-text-dark-secondary']=n.muted;
  v['--color-text-light-highlight']=n.text;v['--color-text-primary']=n.text;
  v['--color-border-light-primary']=n.border;
  return v;
}
function blend(a:string,b:string,weight:number):string {
  return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*weight+parseInt(b.slice(i,i+2),16)*(1-weight)).toString(16).padStart(2,'0')).join('');
}
function readable(color:string,background:string,target:number):string {
  if(contrast(color,background)>=target)return color;
  const end=contrast('#ffffff',background)>contrast('#000000',background)?'#ffffff':'#000000';
  for(let step=1;step<=100;step++){const next=blend(end,color,step/100);if(contrast(next,background)>=target)return next;}
  return end;
}
/** Adapt display colors without mutating the user's saved palette. */
export function adaptPalette(p:Palette,base:BaseSkin):Palette {
  const n=BASE_SURFACES[base];
  const main=p.main;
  const rows=baseRows(base);
  // A visible but base-weighted primary-color wash over the actual base, never a solid fill.
  const tintBase=base==='default-light'?rows.even:rows.odd;
  const tintedRow=blend(p.main,tintBase,.30);
  return {...p,main,deep:readable(p.deep,n.window,4.5),middle:readable(p.middle,n.input,4.5),name:readable(p.name,n.window,4.5),pale:readable(p.pale,main,4.5),
    odd:readable(tintedRow,n.text,4.5),even:rows.even};
}

export function baseContrastWarnings(p:Palette,base:BaseSkin,tintRows:boolean):string[] {
  const n=BASE_SURFACES[base];
  const checks:[string,string,string,number][]=[['Accent',p.main,n.window,3],['Icon',p.deep,n.window,4.5],['Tab text',p.pale,p.main,4.5],['Chat names',p.name,n.window,4.5]];
  if(tintRows)checks.push(['Odd row text',n.text,p.odd,4.5],['Even row text',n.text,p.even,4.5]);
  return checks.filter(([,fg,bg,target])=>contrast(fg,bg)<target).map(([label,fg,bg])=>label+': '+contrast(fg,bg).toFixed(1)+':1');
}
