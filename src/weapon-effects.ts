import {actionEffects,ammoKey,weaponKey,type ActionEffect} from './weapon-effect-events.js';
import {playWeaponEffect,setWeaponVolume,stopWeaponAudio,unlockWeaponAudio,type Point} from './weapon-effect-player.js';
const MODULE='pneuma-visualtools';
declare global {interface SettingConfig {
 'pneuma-visualtools.weaponAnimations':boolean;
 'pneuma-visualtools.weaponSounds':boolean;
 'pneuma-visualtools.weaponVolume':number;
 'pneuma-visualtools.weaponIntensity':number;
}}
interface LiveToken {document:{uuid:string;hidden?:boolean;parent?:{id?:string}};center:Point;w:number;h:number;isVisible:boolean;actor?:Actor}
interface Viewport {stage?:{worldTransform:{a:number;b:number;c:number;d:number;tx:number;ty:number}};app?:{view:HTMLCanvasElement;renderer:{screen:{width:number;height:number}}}}
function token(uuid:string):LiveToken|undefined {return (canvas.tokens?.placeables as unknown as LiveToken[]|undefined)?.find(t=>t.document.uuid===uuid)}
function allowed(t:LiveToken):boolean {return !!game.user?.isGM||(!t.document.hidden&&t.isVisible)}
function screen(p:Point):Point|undefined {
 const view=canvas as unknown as Viewport,m=view.stage?.worldTransform,app=view.app;if(!m||!app)return;
 const rect=app.view.getBoundingClientRect(),w=app.renderer.screen.width,h=app.renderer.screen.height;if(!(w>0&&h>0))return;
 return {x:rect.left+(m.a*p.x+m.c*p.y+m.tx)*rect.width/w,y:rect.top+(m.b*p.x+m.d*p.y+m.ty)*rect.height/h};
}
export function registerWeaponEffects():void {
 const seen=new Set<string>(),active=new Set<()=>void>();let ready=false;
 const stop=()=>{for(const end of [...active])end();active.clear();stopWeaponAudio()};
 game.settings!.register(MODULE,'weaponAnimations',{name:'Show procedural attack effects',hint:'Animate newly resolved Combat Tools attacks, area attacks, grapples, and netrunning actions on the current scene. Respects message visibility and reduced motion.',scope:'client',config:true,type:Boolean,default:true,onChange:stop});
 game.settings!.register(MODULE,'weaponSounds',{name:'Play procedural attack sounds',hint:'Local attack and impact sounds for visible actions. Browser audio unlocks after your first click or keypress. Independent of attack visuals.',scope:'client',config:true,type:Boolean,default:true,onChange:stop});
 game.settings!.register(MODULE,'weaponVolume',{name:'Attack sound volume',hint:'Local procedural effects volume; does not change playlist volume.',scope:'client',config:true,type:Number,default:35,range:{min:0,max:100,step:1},onChange:(value:number)=>setWeaponVolume(value/100)});
 game.settings!.register(MODULE,'weaponIntensity',{name:'Attack visual intensity',hint:'Opacity of procedural attack effects.',scope:'client',config:true,type:Number,default:80,range:{min:10,max:100,step:5},onChange:stop});
 // Keep the session's history identities: evicting old keys could replay a
 // historic attack when a damage receipt or recovery notice is updated later.
 const remember=(key:string)=>{seen.add(key)};
 function run(message:ChatMessage):void {
  if(!ready)return;
  for(const effect of actionEffects(message.id??'',message.flags,message.content??'')){
   if(seen.has(effect.key))continue;remember(effect.key);
   if(!message.visible||message.isContentVisible===false||(message.blind&&!game.user!.isGM)||document.hidden||!canvas.ready)continue;
   if(effect.privateSource&&!game.user!.isGM)continue;
   const source=token(effect.source),target=effect.target?token(effect.target):undefined;
   if(!source||!allowed(source)||(effect.target&&(!target||!allowed(target)))||(effect.scene&&effect.scene!==canvas.scene?.id))continue;
   if(!target&&!effect.point)continue;
   const visuals=game.settings!.get(MODULE,'weaponAnimations'),sound=game.settings!.get(MODULE,'weaponSounds');if((!visuals&&!sound)||active.size>=8)continue;
   let weapon=effect.weapon,ammo=effect.ammo;
   // Respect concealed weapons; never disclose the category via its animation.
   const combat=game.modules?.get('pneuma-combattools');
   const combatSetting=game.settings!.get as (module:string,key:string)=>unknown;
   const concealed=!game.user!.isGM&&!source.actor?.isOwner&&combat?.active&&combatSetting('pneuma-combattools','hideAttackWeapon')!==false&&weapon!=='quickhack'&&weapon!=='grapple';
   if(concealed)continue;
   // Resolve currently loaded ammo only from a visible, inspectable source.
   const item=effect.weaponId&&source.actor?.testUserPermission(game.user!,'LIMITED')?source.actor.items.get(effect.weaponId):undefined;
   if(item){const system=item.system as unknown as {weaponType?:string};
    if(effect.weapon==='melee'||effect.weapon==='bow')weapon=weaponKey(system.weaponType??'',item.name??'');
    if(ammo==='basic'){const loaded=(item as Item & {getInstalledItems?:(type:string)=>Item[]}).getInstalledItems?.('ammo')?.[0];ammo=ammoKey(String((loaded?.system as unknown as {type?:string}|undefined)?.type??''))}
   }
   const positions=()=>{const liveSource=token(effect.source),liveTarget=effect.target?token(effect.target):undefined;if(document.hidden||!liveSource||!allowed(liveSource)||(effect.target&&(!liveTarget||!allowed(liveTarget))))return;
    const from=screen(liveSource.center),to=screen(liveTarget?.center??effect.point!);return from&&to?{source:from,target:to}:undefined};
   const initial=positions();if(!initial)continue;
   const sourceEdge=screen({x:source.center.x+source.w/2,y:source.center.y});
   const targetEdge=target?screen({x:target.center.x+target.w/2,y:target.center.y}):undefined;
   let end:()=>void=()=>{};
   end=playWeaponEffect({weapon,mode:effect.mode,ammo,hit:effect.hit,visuals,sound,volume:game.settings!.get(MODULE,'weaponVolume')/100,intensity:game.settings!.get(MODULE,'weaponIntensity')/100,sourceRadius:sourceEdge?Math.hypot(sourceEdge.x-initial.source.x,sourceEdge.y-initial.source.y):0,targetRadius:targetEdge?Math.hypot(targetEdge.x-initial.target.x,targetEdge.y-initial.target.y):0,positions,onDone:()=>active.delete(end)});active.add(end);
  }
 }
 Hooks.once('ready',()=>{for(const message of game.messages??[])for(const effect of actionEffects(message.id??'',message.flags,message.content??''))remember(effect.key);ready=true;
  const unlock=()=>{if(game.settings!.get(MODULE,'weaponSounds'))void unlockWeaponAudio().catch(()=>{})};document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
 });
 Hooks.on('createChatMessage',(message:ChatMessage)=>run(message));Hooks.on('updateChatMessage',(message:ChatMessage)=>run(message));
 Hooks.on('canvasTearDown',stop);Hooks.on('deleteChatMessage',(message:ChatMessage)=>{for(const effect of actionEffects(message.id??'',message.flags))remember(effect.key)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);
}
