import {currentFlashSettings,flashProfiles,normalizeFlashSettings} from './weapon-light-config.js';

export class WeaponLightSettings extends FormApplication {
 constructor(){super({});}
 static override get defaultOptions(){
  return foundry.utils.mergeObject(super.defaultOptions,{id:'pneuma-weapon-light-settings',title:'Attack flash lighting',
   template:'modules/pneuma-visualtools/weapon-light-settings.hbs',width:500,height:560,resizable:true,closeOnSubmit:false,
   scrollY:['.pvt-light-profiles']});
 }
 override getData(){
  const settings=currentFlashSettings();
  return {matchAmmo:settings.matchAmmo,profiles:flashProfiles.map(([id,name])=>({id,name,isGrenade:id==='grenade',...settings.profiles[id]})),
   units:canvas.scene?.grid?.units||'scene units'};
 }
 override activateListeners(html:JQuery){
  super.activateListeners(html);const root=html[0];if(!root)return;
  const match=root.querySelector<HTMLInputElement>('[name="matchAmmo"]');
  const sync=()=>root.querySelectorAll<HTMLElement>('[data-flash-color]').forEach(group=>{group.inert=!!match?.checked;group.style.opacity=match?.checked?'.5':'';});
  match?.addEventListener('change',sync);sync();
  const automatic=root.querySelector<HTMLInputElement>('[name="profiles.grenade.autoRadius"]');
  const syncRadius=()=>root.querySelectorAll<HTMLInputElement>('[name="profiles.grenade.bright"],[name="profiles.grenade.dim"]').forEach(input=>{input.readOnly=!!automatic?.checked;});
  automatic?.addEventListener('change',syncRadius);syncRadius();
 }
 protected override async _updateObject(_event:Event,formData:Record<string,unknown>):Promise<void>{
  if(!game.user?.isGM)return;
  const data=normalizeFlashSettings(foundry.utils.expandObject(formData),canvas.scene?.grid?.distance||2);
  await game.settings!.set('pneuma-visualtools','weaponLightSettings',data);await this.close();
 }
}
export function registerWeaponLightSettings():void {
 game.settings!.register('pneuma-visualtools','weaponLightSettings',{scope:'world',config:false,type:Object,
  default:{matchAmmo:false,profiles:{}}});
 game.settings!.register('pneuma-visualtools','weaponLighting',{name:'Enable attack lighting',hint:'GM: master switch for native muzzle flashes, explosion flashes and moving rocket lights.',scope:'world',config:true,type:Boolean,default:true,onChange:()=>Hooks.callAll('pneumaWeaponLightingChanged')});
 game.settings!.register('pneuma-visualtools','weaponLightVision',{name:'Provides Vision',hint:'GM: all attack lights provide native vision during their flashes and rocket travel. Applies to new attacks.',scope:'world',config:true,type:Boolean,default:false});
 game.settings!.registerMenu('pneuma-visualtools','weaponLightMenu',{name:'Attack flash lighting',label:'Customize flash lights',
  hint:'GM: color, intensity and bright/dim radii for each flash type. Optionally match animation ammo colors. Applies to new attacks.',
  icon:'fas fa-lightbulb',type:WeaponLightSettings,restricted:true});
}
