const MODULE = 'pneuma-visualtools';
declare global {interface SettingConfig {
 'pneuma-visualtools.scenePreviewsEnabled': boolean;
 'pneuma-visualtools.audioToolsEnabled': boolean;
 'pneuma-visualtools.screenEffects': boolean;
}}
const groups = [
 ['Chat Cards','chatCards','chatSkin','chatPortraitSource','chatFallbackImage'],
 ['Chat Dice','chatDiceEnabled','chatDiceMenu'],
 ['Colors','customThemeEnabled','themeCustomizer'],
 ['Scene Previews','scenePreviewsEnabled'],
 ['Audio & Soundboard','audioToolsEnabled'],
 ['Attack Visuals','weaponAnimations','weaponIntensity','weaponSounds','weaponVolume'],
 ['Escape Handling','fixEscapeKey'],
 ['Full Screen Effects','screenEffects'],
 ['Token Effects','tokenEffects'],
 ['Effect Previews','effectsPreview'],
] as const;
export function groupVisualSettings(root: HTMLElement): void {
 const rows = new Map<string, HTMLElement>();
 root.querySelectorAll<HTMLElement>('[name^="'+MODULE+'."], button[data-key^="'+MODULE+'."]').forEach(control=>{
  const key=(control.getAttribute('name')??control.dataset.key??'').slice(MODULE.length+1);
  const row=control.closest<HTMLElement>('.form-group');if(row)rows.set(key,row);
 });
 if(!rows.size)return;
 const off=root.querySelector<HTMLOptionElement>('[name="'+MODULE+'.chatSkin"] option[value="off"]');
 if(off)off.hidden=true; // Retain the saved OFF value and native form submission.

 let wrapper=root.querySelector<HTMLElement>('.pvt-settings-groups');
 if(!wrapper){wrapper=document.createElement('div');wrapper.className='pvt-settings-groups';rows.values().next().value!.before(wrapper);}
 for(const [title,master,...keys] of groups){
  const ordered=[master,...keys].map(key=>rows.get(key)).filter((row):row is HTMLElement=>!!row);
  if(!ordered.length)continue;
  let group=wrapper.querySelector<HTMLElement>('[data-pvt-settings-master="'+master+'"]');
  if(!group){group=document.createElement('fieldset');group.dataset.pvtSettingsMaster=master;const heading=document.createElement('legend');heading.textContent=title;group.append(heading);wrapper.append(group);}
  group.append(...ordered);
  const toggle=group.querySelector<HTMLInputElement>('[name="'+MODULE+'.'+master+'"]');
  const sync=()=>ordered.forEach(row=>{if(row===rows.get(master)){row.inert=false;return;}
   const sounds=group!.querySelector<HTMLInputElement>('[name="'+MODULE+'.weaponSounds"]');
   row.inert=master==='weaponAnimations' ? row===rows.get('weaponIntensity') ? !!toggle&&!toggle.checked : row===rows.get('weaponVolume') ? !!sounds&&!sounds.checked : false : toggle?!toggle.checked:false;row.classList.toggle('pvt-setting-disabled',row.inert);row.setAttribute('aria-disabled',String(row.inert));});
  group.onchange=sync;sync();
 }
 const input=root.querySelector<HTMLInputElement>('[name="'+MODULE+'.chatFallbackImage"]');
 if(input && !input.closest('.form-group')?.querySelector('[data-pvt-portrait-picker]')){
  const button=document.createElement('button');button.type='button';button.className='file-picker';button.dataset.pvtPortraitPicker='';button.title='Browse fallback chat portrait';button.setAttribute('aria-label',button.title);button.innerHTML='<i class="fas fa-file-import" aria-hidden="true"></i>';
  button.addEventListener('click',event=>{event.preventDefault();new FilePicker({type:'image',current:input.value,callback:path=>{input.value=path;input.dispatchEvent(new Event('change',{bubbles:true}));}}).render(true);});input.after(button);
 }
}
export function registerVisualSettings(): void {
 game.settings!.register(MODULE,'screenEffects',{name:'Enable Full Screen Effects',hint:'Screen overlays for Poison, Blue Glass, Smash, Humanity, On Fire and neural intrusion when available; EMP follows Combat Tools disablements; Electrical Shock awaits gameplay integration. Independent of Token Effects. Respects reduced motion.',scope:'client',config:true,type:Boolean,default:true,onChange:()=>{Hooks.callAll('pneumaVisualToolsScreenEffectsChanged');}});
 for(const [key,name,hint] of [
  ['scenePreviewsEnabled','Enable scene previews','Hover scene compendium entries and open scene artwork. Reload to apply.'],
  ['audioToolsEnabled','Enable audio tools and soundboard','Playlist seeking and playback controls, soundboard and its shortcut. Reload to apply.'],
 ] as const) game.settings!.register(MODULE,key,{name,hint,scope:'client',config:true,type:Boolean,default:true,requiresReload:true});
 Hooks.on('renderSettingsConfig',(_app:unknown,html:JQuery)=>{if(html[0])groupVisualSettings(html[0]);});
}
