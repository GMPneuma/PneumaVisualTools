import {createConditionToken} from './condition-renderers.js';
import {hasBlueGlass,hasPoisonExposure,hasSmash} from './substance-effects.js';
import {createTokenSmashOverlay} from './smash-overlay.js';
import {burningStrength} from './fire-status.js';
import {createTokenPoisonFog} from './token-poison-fog.js';
import {createTokenEffectMask} from './token-effect-mask.js';
import {hasElectricalShock,hasEMP} from './electrical-effects.js';
import {flashbangState} from './flashbang-effects.js';
import {createTokenDazzle} from './token-dazzle.js';
import {actorPatternKinds,type PatternKind} from './remaining-effects.js';
import {createPatternToken} from './remaining-renderers.js';
import {tokenPreview,anyTokenPreview} from './effect-preview-state.js';
import {createTokenFireParticles} from './token-fire-particles.js';
import {createTokenBlueGlassCloud} from './blue-glass-cloud.js';
const MODULE='pneuma-visualtools';
declare global {interface SettingConfig {'pneuma-visualtools.tokenEffects':boolean}}
export function tokenEffectKinds(actor:Actor|undefined):string[] {
 if(!actor)return [];
 const kinds:string[]=[];
 kinds.push(...actorPatternKinds(actor));
 if(hasPoisonExposure(actor.uuid))kinds.push('poison');
 if(hasBlueGlass(actor))kinds.push('blueGlass');
 if(hasSmash(actor))kinds.push('smash');
 if(hasElectricalShock(actor))kinds.push('electrical');
 if(hasEMP(actor))kinds.push('emp');
 const dazzle=flashbangState(actor);if(dazzle)kinds.push(`dazzle:${dazzle.id}`);
 const combat=game.modules?.get('pneuma-combattools') as unknown as {active?:boolean,api?:{hasNeuralIntrusion?:(actor:Actor)=>boolean}}|undefined;
 if(combat?.active&&combat.api?.hasNeuralIntrusion?.(actor))kinds.push('intrusion');
 const fire=burningStrength(actor);if(fire)kinds.push(`fire${fire}`);
 return kinds;
}
export function registerTokenEffects():void {
 type Entry={graphic:PIXI.Graphics,key:string,phase:number,mask:ReturnType<typeof createTokenEffectMask>,emp?:ReturnType<typeof createConditionToken>,fog?:ReturnType<typeof createTokenPoisonFog>,smash?:ReturnType<typeof createTokenSmashOverlay>,dazzle?:ReturnType<typeof createTokenDazzle>,patterns?:Map<PatternKind,ReturnType<typeof createPatternToken>>,fire?:ReturnType<typeof createTokenFireParticles>,blueGlass?:ReturnType<typeof createTokenBlueGlassCloud>};
 const layers=new Map<Token,Entry>();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let ready=false,ticking=false,elapsed=0;
 function remove(token:Token) {const entry=layers.get(token);if(entry){entry.emp?.destroy();entry.blueGlass?.destroy();entry.fire?.destroy();entry.fog?.destroy();entry.smash?.destroy();entry.dazzle?.destroy();entry.patterns?.forEach(pattern=>pattern.destroy());entry.mask.destroy();token.removeChild(entry.graphic);entry.graphic.destroy();layers.delete(token);}}
 function stop() {for(const token of layers.keys())remove(token);if(ticking){canvas.app?.ticker.remove(tick);ticking=false;}}
 function paint(token:Token,entry:Entry) {
  const g=entry.graphic,w=token.w,h=token.h,r=Math.min(w,h),time=reduced.matches?0:elapsed;
  g.clear();
  if(entry.key.split(',').includes('emp')){if(!entry.emp){entry.emp=createConditionToken('emp');g.addChild(entry.emp.container);}entry.emp.update(w,h,time,entry.phase,reduced.matches);}else if(entry.emp){entry.emp.destroy();entry.emp=undefined;}
  if(entry.key.split(',').includes('blueGlass')){if(!entry.blueGlass){entry.blueGlass=createTokenBlueGlassCloud();g.addChild(entry.blueGlass.container);}entry.blueGlass.update(w,h,time,reduced.matches);}
  else if(entry.blueGlass){entry.blueGlass.destroy();entry.blueGlass=undefined;}
  const fireKind=entry.key.split(',').find(kind=>/^fire[123]$/.test(kind));
  if(fireKind){if(!entry.fire){entry.fire=createTokenFireParticles();g.addChild(entry.fire.container);}entry.fire.update(w,h,time,Number(fireKind.slice(4)),reduced.matches);}
  else if(entry.fire){entry.fire.destroy();entry.fire=undefined;}
  const preview=tokenPreview(token);
  const patterns=new Set(preview?entry.key.split(',').filter(kind=>['choking1','choking2','radiation','gas','blackLace','boost','synthcoke','berserker','primeTime','sixgun','timewarp'].includes(kind)) as PatternKind[]:actorPatternKinds(token.actor??undefined));entry.patterns??=new Map();
  for(const [kind,pattern] of entry.patterns)if(!patterns.has(kind)){pattern.destroy();entry.patterns.delete(kind);}
  for(const kind of patterns){let pattern=entry.patterns.get(kind);if(!pattern){pattern=createPatternToken(kind);entry.patterns.set(kind,pattern);g.addChild(pattern.container);}pattern.update(w,h,time,entry.phase,reduced.matches);}
  if(entry.key.split(',').includes('poison')) {
   if(!entry.fog){entry.fog=createTokenPoisonFog();g.addChild(entry.fog.container);}
   entry.fog.update(w,h,time,entry.phase,reduced.matches);
  }else if(entry.fog){entry.fog.destroy();entry.fog=undefined;}
  if(entry.key.split(',').includes('smash')) {
   if(!entry.smash){entry.smash=createTokenSmashOverlay();g.addChild(entry.smash.container);}
   entry.smash.update(w,h,time,entry.phase,reduced.matches);
  }else if(entry.smash){entry.smash.destroy();entry.smash=undefined;}
  const dazzle=preview?preview.kind.startsWith('dazzle:')?{created:preview.created}:undefined:flashbangState(token.actor??undefined);
  if(dazzle){if(!entry.dazzle){entry.dazzle=createTokenDazzle();g.addChild(entry.dazzle.container);}entry.dazzle.update(w,h,reduced.matches?0:Math.max(0,1-(Date.now()-dazzle.created)/1100));}
  else if(entry.dazzle){entry.dazzle.destroy();entry.dazzle=undefined;}
  for(const kind of entry.key.split(',')) {
   if(patterns.has(kind as PatternKind))continue;
   if(kind==='poison'||kind==='smash'||kind==='blueGlass'||kind.startsWith('fire'))continue;
   if(kind.startsWith('dazzle:')) {
    continue;
   }
   if(kind==='electrical') {
    if(reduced.matches)continue;
    const cycle=(time+entry.phase)%2;if(cycle>.55)continue;
    g.lineStyle(Math.max(1,r*.014),0xb5f3ff,Math.sin(cycle/.55*Math.PI)*.9);
    const seed=Math.floor(time/2)+entry.phase;
    g.moveTo(w*.15,h*.3);for(let i=1;i<8;i++)g.lineTo(w*(.15+i*.1),h*(.5+Math.sin(i*7.3+seed)*.25));
    continue;
   }
   if(kind==='emp')continue;
   if(kind==='intrusion') {
    if(reduced.matches)continue;
    const cycle=(time+entry.phase)%7;if(cycle>.65)continue;
    for(let i=0;i<5;i++){const y=h*((i*.173+cycle*.13+entry.phase/8)%1),x=w*(.08+Math.sin(i*3+Math.floor(time*8))*.06);g.lineStyle(0);g.beginFill(i%2?0x56e1ef:0xdc69fa,.22);g.drawRect(x,y,w*.75,Math.max(1,h*.025));g.endFill();}
    continue;
   }
  }
 }
 function tick(delta:number) {elapsed+=Math.min(delta,3)/60;for(const [token,entry] of layers){entry.graphic.visible=token.isVisible;paint(token,entry);}}
 function sync() {
  if(!ready)return;
  if(document.hidden||(!game.settings!.get(MODULE,'tokenEffects')&&!anyTokenPreview())||!canvas.ready){stop();return;}
  const tokens=canvas.tokens?.placeables??[];
  for(const token of layers.keys())if(!tokens.includes(token)||!token.isVisible)remove(token);
  for(const token of tokens) {
   const preview=tokenPreview(token);
   const key=token.isVisible?(preview?.kind??(game.settings!.get(MODULE,'tokenEffects')?tokenEffectKinds(token.actor??undefined).join(','):'')):'';
   if(!key){remove(token);continue;}
   let entry=layers.get(token);
   if(!entry){const graphic=new PIXI.Graphics();graphic.eventMode='none';token.addChild(graphic);entry={graphic,key,phase:Math.random()*Math.PI*2,mask:createTokenEffectMask(token,graphic)};layers.set(token,entry);}
   entry.key=key;paint(token,entry);
  }
  if(layers.size&&!reduced.matches&&!ticking){canvas.app?.ticker.add(tick);ticking=true;}
  if((!layers.size||reduced.matches)&&ticking){canvas.app?.ticker.remove(tick);ticking=false;}
 }
 game.settings!.register(MODULE,'tokenEffects',{name:'Enable Token Effects',hint:'Map token overlays for Poison, Blue Glass, Smash, On Fire and detected Neural Intrusion; EMP follows Combat Tools disablements; Electrical Shock awaits gameplay integration. using the same triggers and expiry as screen effects. Independent of screen preferences. Visible tokens only; reduced motion uses stationary overlays. Local preference.',scope:'client',config:true,type:Boolean,default:true,onChange:sync});
 Hooks.once('ready',()=>{ready=true;sync();});
 Hooks.on('pneumaVisualToolsPreviewChanged',sync);
 for(const hook of ['canvasReady','drawToken','refreshToken','updateToken','deleteToken','updateActor','updateUser','createItem','updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect','updateWorldTime','updateCombat','deleteCombat','pneumaVisualToolsExposureChanged','pneumaVisualToolsElectricalChanged','pneumaCombatToolsNeuralIntrusionChanged','pneumaVisualToolsPatternsChanged'])Hooks.on(hook,sync);
 Hooks.on('canvasTearDown',stop);document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',stop);reduced.addEventListener('change',sync);
}
