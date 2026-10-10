import {createSubstanceOverlay} from './substance-overlay.js';
import {createSmashScreenOverlay} from './smash-overlay.js';
import {createHumanityOverlay} from './humanity-overlay.js';
import {createFlameOverlay} from './fire-overlay.js';
import {createElectricalOverlay} from './electrical-overlay.js';
import {createDazzleScreen} from './dazzle-screen.js';
import {createIntrusionGlitches} from './neural-glitch.js';
import {createPatternScreen} from './remaining-renderers.js';
import {patternKinds,type PatternKind} from './remaining-effects.js';
import {setTokenPreview} from './effect-preview-state.js';
const MODULE='pneuma-visualtools';
const choices=[['poison','Poison'],['blueGlass','Blue Glass'],['smash','Smash'],['fire1','On Fire — Mild'],['fire2','On Fire — Strong'],['fire3','On Fire — Deadly'],['electrical','Electrical Shock'],['emp','EMP'],['dazzle','Flashbang / Dazzled'],['intrusion','Neural Intrusion'],['radiation','Radiation'],['gas','Gas / Tear Gas'],['blackLace','Black Lace'],['boost','Boost'],['synthcoke','Synthcoke'],['berserker','Berserker'],['primeTime','Prime Time'],['sixgun','Sixgun'],['timewarp','Timewarp'],['choking1','Choking 1'],['choking2','Choking 2'],['dissociative','Dissociative (screen only)'],['psychopathy','Psychopathy (screen only)'],['cyberpsycho','Cyberpsycho (screen only)']] as const;
let current:{start:()=>void;stop:()=>void}|undefined,timer:ReturnType<typeof setTimeout>|undefined,touring=false,index=0;
let open:()=>void=()=>{};
export function registerEffectsPreview():void {
 const controllers=new Map<string,{start:()=>void;stop:()=>void}>();
 for(const kind of ['poison','blueGlass'] as const)controllers.set(kind,createSubstanceOverlay(kind));
 controllers.set('smash',createSmashScreenOverlay());controllers.set('electrical',createElectricalOverlay());controllers.set('emp',createElectricalOverlay('emp'));controllers.set('dazzle',createDazzleScreen());
 for(const kind of patternKinds)controllers.set(kind,createPatternScreen(kind));
 for(const kind of ['dissociative','psychopathy','cyberpsycho'] as const){const overlay=createHumanityOverlay();controllers.set(kind,{start:()=>overlay.start(kind),stop:overlay.stop});}
 for(const strength of [1,2,3]){const overlay=createFlameOverlay();controllers.set(`fire${strength}`,{start:()=>overlay.start(strength),stop:overlay.stop});}
 let intrusion=false;const glitch=createIntrusionGlitches(()=>intrusion?'preview':undefined);controllers.set('intrusion',{start:()=>{intrusion=true;glitch.sync();},stop:()=>{intrusion=false;glitch.stop();}});
 const stop=()=>{touring=false;if(timer!==undefined)clearTimeout(timer);timer=undefined;current?.stop();current=undefined;setTokenPreview(undefined);};
 const show=(kind:string,mode='both',seconds=15)=>{
  stop();if(!choices.some(([key])=>key===kind))return;
  const screenOnly=['dissociative','psychopathy','cyberpsycho'].includes(kind);
  const token=canvas.tokens?.controlled?.length===1?canvas.tokens.controlled[0]:undefined;
  if(mode!=='screen'&&!screenOnly&&!token){ui.notifications!.warn('Select one token to preview token effects.');if(mode==='token')return;}
  if(mode!=='token'||screenOnly){current=controllers.get(kind);current?.start();}
  if(mode!=='screen'&&!screenOnly&&token)setTokenPreview(token,kind==='dazzle'?'dazzle:preview':kind);
  timer=setTimeout(stop,Math.max(2,Math.min(120,seconds))*1000);
  ui.notifications!.info(`Preview: ${choices.find(([key])=>key===kind)![1]}`);
 };
 const tour=(mode:string,seconds:number)=>{index=0;const next=()=>{if(index>=choices.length){stop();return;}show(choices[index++]![0],mode,seconds);touring=true;if(timer!==undefined)clearTimeout(timer);timer=setTimeout(()=>{if(touring)next();},Math.max(2,Math.min(120,seconds))*1000);};next();};
 open=()=>{new Dialog({title:'Visual Effects Preview',content:`<p>Local visual test. Select one map token for token previews. Humanity previews are screen-only.</p><div class="form-group"><label>Effect</label><select name="effect">${choices.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></div><div class="form-group"><label>Display</label><select name="mode"><option value="both">Screen + selected token</option><option value="screen">Screen only</option><option value="token">Token only</option></select></div><div class="form-group"><label>Seconds per effect</label><input name="seconds" type="number" value="15" min="2" max="120"></div><div style="display:flex;gap:6px;margin-top:12px"><button type="button" data-effect-preview>Preview</button><button type="button" data-effect-tour>Play All</button><button type="button" data-effect-stop>Stop</button></div>`,buttons:{close:{label:'Close'}},render:html=>{const root=html as JQuery;const seconds=()=>Number(root.find('[name=seconds]').val())||15;root.find('[data-effect-preview]').on('click',()=>show(String(root.find('[name=effect]').val()),String(root.find('[name=mode]').val()),seconds()));root.find('[data-effect-tour]').on('click',()=>tour(String(root.find('[name=mode]').val()),seconds()));root.find('[data-effect-stop]').on('click',stop);},close:stop}).render(true);};
 class PreviewMenu extends FormApplication {constructor(){super({});}override async _updateObject(_event:Event,_data:object):Promise<void>{}override render(..._args:Parameters<FormApplication['render']>):this{open();return this;}}
 game.settings!.registerMenu(MODULE,'effectsPreview',{name:'Test visual effects',label:'Preview effects',hint:'Preview one effect or play through every effect locally. No actor, item, combat or saved setting changes.',icon:'fas fa-eye',type:PreviewMenu,restricted:false});
 const module=game.modules!.get(MODULE) as unknown as {api?:Record<string,unknown>};module.api={...module.api,effectsPreview:{open:()=>open(),show,stop,tour}};
 Hooks.on('canvasTearDown',stop);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
}
