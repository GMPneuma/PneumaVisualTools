import {normalizeBase, type BaseSkin} from './base-skins.js';
export const COLOR_ROLES = [
  {key: 'deep', label: 'Deep accent', hint: 'Highlighted icons'},
  {key: 'main', label: 'Main accent', hint: 'Active tabs and accent borders'},
  {key: 'middle', label: 'Middle accent', hint: 'Hover and interaction accents'},
  {key: 'bright', label: 'Bright accent', hint: 'Tab underlays'},
  {key: 'pale', label: 'Pale accent', hint: 'Highlighted tab text'},
  {key: 'name', label: 'Chat names', hint: 'Sender names on chat backgrounds'},
  {key: 'odd', label: 'Tinted row 1', hint: 'Alternating rows when row tinting is enabled'},
  {key: 'even', label: 'Tinted row 2', hint: 'Other rows when row tinting is enabled'},
] as const;
export type ColorRole = typeof COLOR_ROLES[number]['key'];
export type Palette = Record<ColorRole, string>;
export type ThemeMode = 'light' | 'dark';
export type CustomTheme = {base: BaseSkin | null; enabled: boolean; tintRows: boolean; colorizeButtons: boolean; colorizeGlows: boolean; mode: ThemeMode | 'automatic'; method:'simple'|'manual'; seed:string; light: Palette; dark: Palette};
export const DEFAULT_THEME: CustomTheme = {
  base: null, enabled: false, tintRows: false, colorizeButtons: true, colorizeGlows: true, mode: 'automatic', method:'simple',seed:'#4d771f',
  light: {deep:'#263f0e',main:'#4d771f',middle:'#5f9028',bright:'#92d050',pale:'#b5ffa1',name:'#365a18',odd:'#d9e7cc',even:'#edf4e7'},
  dark: {deep:'#a9cf86',main:'#456b2a',middle:'#557c35',bright:'#78a84f',pale:'#9dcc7c',name:'#9dcc7c',odd:'#20271d',even:'#293126'},
};
export const NEUTRALS = {
  light: {surface0:'#ffffff',surface1:'#eeeeee',surface2:'#dddddd',surface3:'#cccccc',chat:'#c0c0c0',border:'#888888',text:'#222222',strong:'#111111',inactive:'#202020'},
  dark: {surface0:'#262626',surface1:'#222222',surface2:'#1b1b1b',surface3:'#151515',chat:'#202020',border:'#787878',text:'#e8e8e8',strong:'#ffffff',inactive:'#303030'},
} as const;
export function normalizeTheme(value: unknown): CustomTheme {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<CustomTheme>;
  const result: CustomTheme = structuredClone(DEFAULT_THEME);
  result.base = normalizeBase(v.base);
  result.enabled = result.base !== 'pneuma-hub' && v.enabled === true;
  result.tintRows = v.tintRows === true;
  result.colorizeButtons = v.colorizeButtons !== false;
  result.colorizeGlows = v.colorizeGlows !== false;
  result.mode = v.mode === 'light' || v.mode === 'dark' ? v.mode : 'automatic';
  result.method='simple';
  const valid=(color:unknown):color is string=>typeof color==='string' && /^#[0-9a-f]{6}$/i.test(color);
  // Migrate manual palettes to their primary color; keep presets usable.
  const legacyMain=v.mode==='dark'||v.base==='default-dark'||v.base==='pneuma-dark'?v.dark?.main:v.light?.main;
  const primary=v.method==='manual'&&valid(legacyMain)?legacyMain:v.seed;
  if(valid(primary))result.seed=primary.toLowerCase();
  result.light=generatePalette(result.seed,'light');
  result.dark=generatePalette(result.seed,'dark');
  return result;
}
export function contrast(a: string, b: string): number {
  const luminance = (hex: string): number => {
    const c = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
    return c[0]!*.2126+c[1]!*.7152+c[2]!*.0722;
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function onColor(background: string): string {
  const dark=contrast('#111111',background)>=4.5?'#111111':'#000000';
  return contrast(dark,background) >= contrast('#ffffff',background) ? dark : '#ffffff';
}
function hsl(hex: string): [number,number,number] {
  const [r,g,b] = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255) as [number,number,number];
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min, l=(max+min)/2;
  const h = d === 0 ? 0 : max === r ? ((g-b)/d+6)%6 : max === g ? (b-r)/d+2 : (r-g)/d+4;
  return [h*60, d === 0 ? 0 : d/(1-Math.abs(2*l-1)), l];
}
function hexHsl(h: number,s: number,l: number): string {
  const a=s*Math.min(l,1-l);
  const f=(n: number) => {const k=(n+h/30)%12; return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');};
  return `#${f(0)}${f(8)}${f(4)}`;
}
export function generatePalette(seed: string, mode: ThemeMode): Palette {
  const [h,s] = hsl(seed);
  const template = DEFAULT_THEME[mode];
  const result = {...template, main:seed.toLowerCase()};
  for (const {key} of COLOR_ROLES) {
    if(key==='main')continue; // Primary Color is exact, including saturation and brightness.
    const [,,tl] = hsl(template[key]);
    result[key] = hexHsl(h, s === 0 ? 0 : Math.min(.85, s*(key === 'odd' || key === 'even' ? .35 : 1)), tl);
  }
  const n=NEUTRALS[mode];
  const fit=(key:ColorRole, background:string, target:number):void => {
    const [hue,saturation,lightness]=hsl(result[key]);
    const toward=contrast('#ffffff',background)>contrast('#111111',background) ? 1 : 0;
    for(let step=1;contrast(result[key],background)<target && step<=100;step++) result[key]=hexHsl(hue,saturation,lightness+(toward-lightness)*step/100);
  };
  fit('middle',n.surface0,3);
  fit('deep',n.surface3,4.5);fit('name',n.chat,4.5);
  fit('bright','#111111',4.5);fit('pale',result.main,4.5);
  return result;
}
/** Override explicit accent roles only. CPR base colors also feed surfaces,
 * ordinary text and semantic success/failure indicators, so leave them native. */
export function paletteVariables(p: Palette, _mode: ThemeMode, tintRows = false, colorizeGlows = true): Record<string,string> {
  const vars:Record<string,string> = {
    '--pvt-custom-main':p.main, '--pvt-custom-name':p.name,
    '--pvt-custom-on-main':onColor(p.main),
  };
  // Rebind accent aliases at their declaration scope, leaving neutral roles alone.
  const groups:[string,string[]][] = [
    [p.main,['background-border','background-tab-active','background-dialog-border','text-header-line','text-header-arrow','background-toggle-checked','icon-actor-image-overlay-border']],
    [p.middle,['text-foundry-hover']],
    [p.deep,['text-icon-highlight']],
    [p.bright,['background-tab-underlay']],
    [p.pale,['text-tab-highlight']],
  ];
  if(colorizeGlows){
    vars['--color-shadow-primary']=p.main;vars['--color-shadow-highlight']=p.main;
    vars['--cpr-background-foundry-hover']=p.main;
  }
  if (tintRows) groups.push([p.odd,['background-row-odd']]);
  for(const [value,keys] of groups) for(const key of keys) vars['--cpr-'+key]=value;
  return vars;
}
export function contrastWarnings(p: Palette, mode: ThemeMode): string[] {
  const n=NEUTRALS[mode];
  const checks: [string,string,string,number][] = [
    ['Chat names',p.name,n.chat,4.5], ['Deep accent text',p.deep,n.surface3,4.5],
    ['Section headings',p.bright,'#111111',4.5], ['Highlighted tab text',p.pale,p.main,4.5],
    ['Main accent border',p.main,n.surface2,3], ['Hover accent',p.middle,n.surface0,3],
  ];
  return checks.filter(([,a,b,target]) => contrast(a,b)<target).map(([label,a,b]) => `${label}: ${contrast(a,b).toFixed(1)}:1 contrast`);
}
