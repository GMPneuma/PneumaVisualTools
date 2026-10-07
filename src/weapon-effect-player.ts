export interface Point {x:number;y:number}
export interface WeaponProfile {name:string;family:string;travel:number;flash?:number;tail?:number;width?:number;recoil?:number;impact?:number;sparks?:number;automatic?:boolean;interval?:number}
interface Round {delay:number;offset:number}
interface Ammo {name:string;color:string;kind:string}
interface Shot {hit:boolean;p:Ammo;gun:WeaponProfile;mode:string;rounds:Round[];scale:number;time:number;seed:number;reduced:boolean;label:string;sourcePan:number;targetPan:number}
export interface EffectOptions {weapon:string;mode?:string;ammo?:string;hit:boolean;visuals:boolean;sound:boolean;volume:number;intensity:number;sourceRadius?:number;targetRadius?:number;positions:()=>{source:Point;target:Point}|undefined;onDone?:()=>void}
let audio:AudioContext|null=null,master:GainNode|null=null,noise:AudioBuffer|null=null,volume=.35;
const nodes=new Set<AudioScheduledSourceNode>();
export function stopWeaponAudio():void {for(const node of nodes){try{node.stop()}catch{}}nodes.clear()}
export function setWeaponVolume(value:number):void {volume=Math.max(0,Math.min(1,value));if(audio&&master)master.gain.setTargetAtTime(volume*.65,audio.currentTime,.02)}
const profiles:Record<string,Ammo>={basic:{name:'Basic',color:'#ffc46b',kind:'spark'},armorPiercing:{name:'Armor Piercing',color:'#76dcff',kind:'pierce'},incendiary:{name:'Incendiary',color:'#ff783b',kind:'fire'},expansive:{name:'Expansive',color:'#ff759e',kind:'bloom'},rubber:{name:'Rubber',color:'#b49aff',kind:'bounce'},smart:{name:'Smart',color:'#74f4b1',kind:'smart'}};
export const weaponProfiles:Record<string,WeaponProfile>={
 pistol:{name:'Pistol',family:'gun',travel:180,flash:22,tail:55,width:2.5,recoil:6,impact:18,sparks:12},
 smg:{name:'SMG',family:'gun',travel:150,flash:16,tail:42,width:2,recoil:4,impact:14,sparks:9,automatic:true,interval:82},
 rifle:{name:'Rifle',family:'gun',travel:125,flash:31,tail:90,width:2,recoil:9,impact:23,sparks:18,automatic:true,interval:115},
 shotgun:{name:'Shotgun',family:'shotgun',travel:170,flash:38,tail:35,width:1.5,recoil:13,impact:24,sparks:24},
 sniper:{name:'Sniper Rifle',family:'gun',travel:105,flash:19,tail:110,width:1.5,recoil:10,impact:25,sparks:17},
 bow:{name:'Bow',family:'arrow',travel:410,recoil:3,impact:13,sparks:5},
 crossbow:{name:'Crossbow',family:'arrow',travel:300,recoil:4,impact:15,sparks:7},
 grenade:{name:'Grenade Throw',family:'grenade',travel:850,recoil:2,impact:60,sparks:36},
 rocket:{name:'Rocket',family:'rocket',travel:650,recoil:8,impact:75,sparks:42},
 melee:{name:'Melee',family:'melee',travel:460,impact:25,sparks:13},
 blade:{name:'Katana',family:'blade',travel:420,impact:22,sparks:12},
 punch:{name:'Brawling',family:'punch',travel:360,impact:17,sparks:8},
 grapple:{name:'Grapple',family:'grapple',travel:340,impact:20,sparks:0},
 martial:{name:'Martial Art Attack',family:'martial',travel:720,impact:22,sparks:12},
 quickhack:{name:'Netrunner Quickhack',family:'data',travel:900,impact:22,sparks:0}
};
export function unlockWeaponAudio(){if(!audio){audio=new AudioContext();master=audio!.createGain();const limiter=audio!.createDynamicsCompressor();limiter.threshold.value=-9;limiter.knee.value=6;limiter.ratio.value=12;limiter.attack.value=.001;limiter.release.value=.12;master!.connect(limiter);limiter.connect(audio!.destination);noise=audio!.createBuffer(1,audio!.sampleRate,audio!.sampleRate);const d=noise!.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}master!.gain.value=volume*.65;return audio!.resume()}
function voice(at:number,duration:number,level:number,freq:number,endFreq:number,type: OscillatorType|'noise'='noise',filterType:BiquadFilterType='lowpass',q=.7,pan=0){const node:AudioBufferSourceNode|OscillatorNode=type==='noise'?audio!.createBufferSource():audio!.createOscillator();if(node instanceof AudioBufferSourceNode)node.buffer=noise;else{node.type=type as OscillatorType;node.frequency.setValueAtTime(freq,at);node.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),at+duration)}const filter=audio!.createBiquadFilter();filter.type=filterType;filter.Q.value=q;filter.frequency.setValueAtTime(freq,at);filter.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),at+duration);const gain=audio!.createGain();gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level),at+.003);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);const stereo=audio!.createStereoPanner();stereo.pan.value=pan;node.connect(filter);filter.connect(gain);gain.connect(stereo);stereo.connect(master!);nodes.add(node);node.onended=()=>{nodes.delete(node);node.disconnect();filter.disconnect();gain.disconnect();stereo.disconnect()};node.start(at);node.stop(at+duration+.02)}
function gunReport(gun:WeaponProfile,at:number,sourcePan=-.5){
  // A cached pressure transient plus turbulent broadband blast. No pitched
  // oscillator sweep: reflections repeat the impulse rather than adding tones.
  const rifle=gun.name==='Rifle',key=rifle?'rifle':'pistol';
  reportBuffers??={};
  if(!reportBuffers[key]){
    const rate=audio!.sampleRate,length=Math.ceil(rate*.48),buffer=audio!.createBuffer(1,length,rate),data=buffer.getChannelData(0);
    let low=0,mid=0,seed=rifle?9317:4813;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1};
    for(let i=0;i<length;i++){
      const t=i/rate,n=random();low+=.035*(n-low);mid+=.24*(n-mid);
      const onset=1-Math.exp(-t/.00012),crack=Math.exp(-t/(rifle?.007:.0045));
      const blast=Math.exp(-t/(rifle?.039:.025));
      const body=Math.exp(-t/(rifle?.055:.035));
      const pressure=(1-t/.002)*Math.exp(-t/.002);
      // Broadband crack, low/mid blast, and a short nonperiodic pressure pulse.
      data[i]=onset*((n-mid)*crack*.72+mid*blast*1.1+low*body*2.8+pressure*.5);
    }
    const dry=data.slice();
    for(const [delay,gain] of (rifle?[[.038,.22],[.071,.12],[.119,.065]]:[[.026,.15],[.053,.08],[.094,.04]])){
      const offset=Math.round(delay!*rate);for(let i=offset;i<length;i++)data[i]=(data[i]??0)+(dry[i-offset]??0)*gain!;
    }
    let peak=0;for(let i=0;i<length;i++){data[i]=Math.tanh(data[i]!*1.6);peak=Math.max(peak,Math.abs(data[i]!))}
    for(let i=0;i<length;i++)data[i]=data[i]!/Math.max(peak,1e-6)*.82;
    reportBuffers[key]=buffer;
  }
  const node=audio!.createBufferSource(),pan=audio!.createStereoPanner();node.buffer=reportBuffers[key];pan.pan.value=sourcePan;node.connect(pan);pan.connect(master!);nodes.add(node);node.onended=()=>{nodes.delete(node);node.disconnect();pan.disconnect()};node.start(at);node.stop(at+.48);
}
let reportBuffers:Record<string,AudioBuffer>|undefined;
function weaponAudio(s:Shot,r:Round,index:number){const g=s.gun,f=g.family,at=audio!.currentTime+.012+r.delay*s.scale/1000,impact=at+g.travel*s.scale/1000,pan=s.targetPan;
 if(f==='data'){for(let i=0;i<5;i++)voice(at+i*.075,.045,.035,720+i*170,720+i*170,'square','lowpass',.5,s.sourcePan+i*.1);voice(at,.35,.025,4200,2500,'noise','bandpass',.7,0)}else if(['gun','shotgun'].includes(f)){
  const report={...g,name:['Rifle','Sniper Rifle','Shotgun'].includes(g.name)?'Rifle':'Pistol'};gunReport(report,at,s.sourcePan);
  if(g.name==='Shotgun')voice(at,.17,.2,800,350,'noise','lowpass',.5,s.sourcePan);
  if(g.name==='SMG')voice(at,.024,.1,5200,4200,'noise','highpass',.5,s.sourcePan);
  if(g.name==='Sniper Rifle')voice(at+.055,.3,.09,1400,500,'noise','bandpass',.5,-.25);
  voice(at+.035,.05,.018,6000,5000,'noise','highpass',.5,0);
 }else if(f==='arrow'){
  voice(at,.08,.14,g.name==='Crossbow'?3500:1900,800,'noise','bandpass',.6,-.5);voice(at+.01,.075,.06,260,160,'triangle','lowpass',.5,s.sourcePan);
 }else if(f==='rocket'){voice(at,.32,.28,2600,700,'noise','lowpass',.7,-.5);voice(at,.3,.16,90,40,'sine','lowpass',.5,s.sourcePan)}
 else if(f==='grenade'){voice(at,.07,.05,2400,1200,'noise','bandpass',.5,s.sourcePan)}
 else{voice(at+.03,.11,.08,f==='blade'?4500:1700,900,'noise','bandpass',.5,0)}
 if(f==='data'){voice(impact,.08,.06,s.hit?1400:350,s.hit?1400:220,'triangle','lowpass',.5,pan);voice(impact+.09,.1,.04,s.hit?1900:250,s.hit?1900:160,'triangle','lowpass',.5,pan)}else if(['rocket','grenade'].includes(f)){
  voice(impact,.42,.4,2200,120,'noise','lowpass',.5,pan);voice(impact,.35,.3,75,25,'sine','lowpass',.5,pan);voice(impact+.04,.55,.13,1800,300,'noise','bandpass',.5,pan);
 }else if(s.hit&&s.mode!=='suppression'){
  if(f==='grapple'){voice(impact,.14,.13,650,280,'noise','lowpass',.5,pan)}
  else{voice(impact,.025,.18,f==='blade'?6500:3800,2200,'noise','highpass',.5,pan);voice(impact,.085,.25,f==='arrow'?450:650,280,'noise','lowpass',.5,pan)}
  if(s.p.kind==='fire')for(let i=0;i<3;i++)voice(impact+i*.07,.055,.03,2400,1500,'noise','bandpass',.5,pan);
  if(s.p.kind==='pierce')voice(impact+.01,.045,.065,7500,6000,'noise','highpass',.5,pan);
 }else{voice(impact-.03,.07,.06,4000,2700,'noise','bandpass',.5,pan);if(['gun','shotgun','arrow'].includes(f))voice(impact,.055,.1,6000,1800,'noise','highpass',.5,.9)}
}
export function playWeaponEffect(options:EffectOptions):()=>void {
 const gun=weaponProfiles[options.weapon]??weaponProfiles.pistol!;
 const mode=gun.automatic?options.mode??'single':'single';
 const p=['melee','blade','punch','martial','grapple'].includes(gun.family)?{name:'Physical',color:gun.family==='blade'?'#b6eaff':gun.family==='martial'?'#8ee7ff':'#efbf87',kind:'spark'}:gun.family==='data'?{name:'Data',color:'#66ffe0',kind:'spark'}:profiles[options.ammo??'basic']??profiles.basic!;
 const count=mode==='auto'?5:mode==='suppression'?8:1;
 const rounds:Round[]=Array.from({length:count},(_,i)=>({delay:i*(gun.interval??100),offset:Math.sin(i*2.3)*80}));
 const layer=document.createElement('canvas');layer.setAttribute('aria-hidden','true');layer.className='pneuma-weapon-effects';
 Object.assign(layer.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'60',opacity:String(Math.max(0,Math.min(1,options.intensity)))});
 const context=layer.getContext('2d');if(!context){options.onDone?.();return ()=>{}}const ctx=context;
 if(options.visuals)document.body.append(layer);
 let source:Point={x:0,y:0},target:Point={x:0,y:0},frame=0,done=false;
 const initial:Shot={hit:options.hit,p,gun,mode,rounds,scale:1.2,time:performance.now(),seed:Math.random()*6,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,label:'',sourcePan:0,targetPan:0};
 const placement=options.positions();initial.sourcePan=placement?Math.max(-.85,Math.min(.85,placement.source.x/innerWidth*2-1)):0;initial.targetPan=placement?Math.max(-.85,Math.min(.85,placement.target.x/innerWidth*2-1)):0;
 let shot:Shot|null=initial;
 setWeaponVolume(options.volume);
 if(options.sound&&audio?.state==='running')rounds.forEach((r,i)=>weaponAudio(initial,r,i));
 function base(){const positions=options.positions();if(!positions){stop();return}source=positions.source;target=positions.target;
 if(layer.width!==innerWidth||layer.height!==innerHeight){layer.width=innerWidth;layer.height=innerHeight}
 ctx.clearRect(0,0,layer.width,layer.height);ctx.globalAlpha=1;
 }
 function stop(){if(done)return;done=true;shot=null;cancelAnimationFrame(frame);layer.remove();options.onDone?.()}
function star(x:number,y:number,r:number,alpha:number,color:string,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=Math.max(0,alpha);ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=16;ctx.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,size=i%2?r*.3:r;ctx.lineTo(Math.cos(a)*size,Math.sin(a)*size)}ctx.closePath();ctx.fill();ctx.restore()}
function line(x:number,y:number,x2:number,y2:number,color:string,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
function digitalImpact(x:number,y:number,progress:number,color:string,explosive=false){
 ctx.save();ctx.translate(x,y);ctx.globalAlpha=Math.max(0,1-progress);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.5;ctx.shadowColor=color;ctx.shadowBlur=8;
 const size=(explosive?28:12)+progress*(explosive?65:24),arm=explosive?13:7;
 for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]] as [number,number][]){ctx.beginPath();ctx.moveTo(sx*(size-arm),sy*size);ctx.lineTo(sx*size,sy*size);ctx.lineTo(sx*size,sy*(size-arm));ctx.stroke()}
 ctx.fillStyle=color+'44';ctx.fillRect(-size*.6,-3,size*1.2,6);
 for(let i=0;i<(explosive?12:7);i++){const sign=i%2?1:-1,dx=sign*(8+progress*(20+i*4)),dy=((i*17)%39-19)*(1+progress);ctx.fillStyle=i%3?color:'#e9ffff';ctx.fillRect(dx,dy,3+i%3*3,2)}
 ctx.restore();
}
function physicalImpact(x:number,y:number,k:number,color:string,s:Shot,ux:number,uy:number){
 const f=s.gun.family,explosive=['grenade','rocket'].includes(f),alpha=Math.max(0,1-k);ctx.save();ctx.translate(x,y);if(['melee','blade','punch','martial'].includes(f))ctx.scale(.8,.8);ctx.globalAlpha=alpha;ctx.shadowColor=color;ctx.shadowBlur=8;ctx.strokeStyle=color;ctx.fillStyle=color;
 if(s.reduced){ctx.globalAlpha=alpha*.7;ctx.beginPath();ctx.ellipse(0,0,9,5,Math.atan2(uy,ux),0,Math.PI*2);ctx.fill();ctx.restore();return}
 if(explosive){
  // Irregular expanding pressure front, hot core, and tumbling debris.
  ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,r=(15+k*100)*(1+.09*Math.sin(i*2.7));i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.stroke();
  const core=ctx.createRadialGradient(0,0,1,0,0,25+k*38);core.addColorStop(0,'#fff4d5');core.addColorStop(.25,color+'aa');core.addColorStop(1,color+'00');ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,25+k*38,0,Math.PI*2);ctx.fill();
 }else if(f==='blade'){
  // Two bright cuts peel apart; small fragments follow the cut direction.
  ctx.rotate(Math.atan2(uy,ux)-.65);for(let i=0;i<2;i++){const offset=(i?1:-1)*k*10;line(-7-k*20,offset,24+k*45,offset,color,Math.max(1,7*(1-k)));line(-4-k*17,offset,8+k*24,offset,'#f4ffff',1)}
  for(let i=0;i<6;i++){const px=(i-2)*8+k*20,py=(i%2?1:-1)*(3+k*16);line(px,py,px+5,py+2,color,1)}
 }else if(['punch','melee','martial'].includes(f)){
  // Flattened compression waves carry the direction of the strike.
  ctx.rotate(Math.atan2(uy,ux));for(let i=0;i<3;i++){const phase=k-i*.13;if(phase<0)continue;ctx.globalAlpha=alpha*(1-i*.22);ctx.lineWidth=4.5-i*.9;ctx.beginPath();ctx.ellipse(phase*18,0,6+phase*23,16+phase*42,0,-1.3,1.3);ctx.stroke()}
  ctx.globalAlpha=alpha;ctx.fillStyle='#edffff';ctx.beginPath();ctx.ellipse(0,0,Math.max(1,11*(1-k)),Math.max(1,19*(1-k)),0,0,Math.PI*2);ctx.fill();
 }else if(f==='grapple'){
  // Interlocking arcs close around the contact point rather than an impact.
  ctx.lineWidth=3;for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(i?8:-8,0,13+k*8,i?Math.PI*.6:-Math.PI*.4,i?Math.PI*1.8:Math.PI*.8);ctx.stroke()}
 }else{
  // A tiny contact flash and asymmetric fan of chips thrown away from the hit.
  ctx.rotate(Math.atan2(uy,ux));ctx.fillStyle='#fff4db';ctx.beginPath();ctx.ellipse(0,0,Math.max(1,7*(1-k)),Math.max(1,4*(1-k)),0,0,Math.PI*2);ctx.fill();
  const count=f==='shotgun'?17:f==='arrow'?5:10;
  for(let i=0;i<count;i++){const angle=-1.25+(i/(count-1))*2.5+(i%2*.13),speed=18+(i*13)%42,px=Math.cos(angle)*k*speed,py=Math.sin(angle)*k*speed+k*k*15;ctx.save();ctx.translate(px,py);ctx.rotate(angle+k*3);ctx.fillStyle=i%3?color:'#eaffff';ctx.beginPath();ctx.moveTo(-3,-1);ctx.lineTo(4,0);ctx.lineTo(-1,2);ctx.closePath();ctx.fill();ctx.restore()}
  if(s.p.kind==='pierce'){line(0,0,12+k*50,0,color,1);line(1,-3,8+k*22,-3,'#f1ffff',1)}
  if(s.p.kind==='bloom'){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(k*5,0,5+k*14,8+k*24,0,-1.4,1.4);ctx.stroke()}
 }
 ctx.restore();
}

function closeStrike(ctx:CanvasRenderingContext2D, family:string, x:number, y:number, angle:number, progress:number, size:number, variant:number) {
 const wind=.28, strike=Math.max(0,Math.min(1,(progress-wind)/(1-wind))), eased=1-Math.pow(1-strike,3);
 const recovery=Math.max(0,progress-1), fade=Math.max(0,1-recovery*2.5);
 const swing=progress<wind?-1.75-progress/wind*.35:-2.1*(1-eased)+recovery*.9;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(size*.8,size*.8);ctx.globalAlpha*=fade;
 const shape=(points:[number,number][],fill:string,stroke='#e4f4fc')=>{ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.fill();ctx.stroke()};
 const skin=ctx.createLinearGradient(0,-15,0,16);skin.addColorStop(0,'#deb99a');skin.addColorStop(.48,'#b88a68');skin.addColorStop(1,'#79513d');
 const fist=()=>{
  ctx.fillStyle=skin;ctx.strokeStyle='#644635';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-49,-7);ctx.quadraticCurveTo(-30,-10,-17,-7);ctx.quadraticCurveTo(-13,-8,-11,-12);ctx.quadraticCurveTo(-8,-16,-3,-13);ctx.quadraticCurveTo(2,-16,5,-12);ctx.quadraticCurveTo(10,-13,12,-8);ctx.quadraticCurveTo(16,-3,13,5);ctx.quadraticCurveTo(12,11,6,12);ctx.quadraticCurveTo(-6,15,-16,7);ctx.quadraticCurveTo(-33,9,-49,7);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#8b6047';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-6+i*6,-10);ctx.quadraticCurveTo(-4+i*6,-6,-5+i*6,-2);ctx.stroke()}
  ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-15,5);ctx.bezierCurveTo(-12,-1,-5,-1,2,3);ctx.quadraticCurveTo(6,7,1,9);ctx.quadraticCurveTo(-8,11,-15,5);ctx.fill();ctx.stroke();
 };
 ctx.shadowBlur=0;
 if(family==='blade'||family==='melee') {
  ctx.translate(-72,0);
  // Broad fading sweep follows the weapon tip, with an opaque weapon above it.
  if(progress>wind){for(let i=5;i>0;i--){ctx.save();ctx.globalAlpha*=.08+(5-i)*.025;ctx.rotate(swing-i*.13);shape([[8,-5],[70,-3],[78,0],[70,3],[8,5]],family==='blade'?'#afedff':'#d9b480');ctx.restore()}}
  ctx.rotate(swing);
  shape([[-24,-5],[0,-5],[0,5],[-24,5]],'#273746','#8eabb9');
  for(let i=-20;i<0;i+=5){ctx.strokeStyle='#7892a1';ctx.beginPath();ctx.moveTo(i,-4);ctx.lineTo(i+2,4);ctx.stroke()}
  if(family==='blade') {
   // Compact round tsuba and a single-edged, gently curved katana blade.
   ctx.fillStyle='#322e29';ctx.strokeStyle='#a58d60';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(2,0,3,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.fillStyle='#9eafb6';ctx.strokeStyle='#56656c';ctx.beginPath();ctx.moveTo(5,-3);ctx.quadraticCurveTo(44,-2,68,-10);ctx.lineTo(76,-12);ctx.lineTo(71,-6);ctx.quadraticCurveTo(44,4,5,3);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.strokeStyle='#e5ecec';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(7,2);ctx.quadraticCurveTo(44,3,71,-7);ctx.lineTo(76,-12);ctx.stroke();
  }
  else {shape([[2,-6],[55,-9],[55,9],[2,6]],'#596a78');shape([[44,-15],[70,-13],[75,-8],[75,8],[70,13],[44,15]],'#8395a0');shape([[46,-14],[68,-12],[72,-8],[46,-8]],'#d8e6ed');for(let i=10;i<40;i+=8){ctx.strokeStyle='#273746';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(i,-6);ctx.lineTo(i,6);ctx.stroke()}}
 } else {
  const reach=progress<wind?-22-progress/wind*9:-31+31*eased-recovery*55;
  const lift=Math.sin((1-eased)*Math.PI)*12;
  if(progress>wind&&progress<1.15){ctx.strokeStyle=family==='martial'?'#8ee7ff':'#efbf87';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.globalAlpha=fade*(.28-i*.06);ctx.beginPath();ctx.moveTo(reach-66-i*8,lift-12+i*12);ctx.lineTo(reach-24,lift-12+i*12);ctx.stroke()}ctx.globalAlpha=fade;}
  ctx.translate(reach,lift);
  if(family==='martial'){
   // Open palm with separated fingers, thumb and a narrow wrist.
   ctx.fillStyle=skin;ctx.strokeStyle='#644635';ctx.lineWidth=.9;ctx.beginPath();
   ctx.moveTo(-49,-7);ctx.quadraticCurveTo(-31,-9,-19,-7);ctx.quadraticCurveTo(-13,-11,-7,-11);
   ctx.lineTo(15,-15);ctx.quadraticCurveTo(21,-15,20,-11);ctx.lineTo(2,-7);
   ctx.lineTo(23,-8);ctx.quadraticCurveTo(29,-7,25,-3);ctx.lineTo(3,-2);
   ctx.lineTo(24,-1);ctx.quadraticCurveTo(30,1,25,4);ctx.lineTo(2,4);
   ctx.lineTo(18,6);ctx.quadraticCurveTo(24,9,18,11);ctx.lineTo(-4,8);
   ctx.quadraticCurveTo(-6,10,-2,15);ctx.quadraticCurveTo(1,21,-4,21);ctx.quadraticCurveTo(-13,16,-18,8);
   ctx.quadraticCurveTo(-33,9,-49,7);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.strokeStyle='#95694e';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-12,-3);ctx.quadraticCurveTo(-4,0,-7,7);ctx.moveTo(-15,4);ctx.quadraticCurveTo(-8,1,-2,3);ctx.stroke();
  }
  else fist();
 }
 ctx.restore();
}

function dataStream(sx:number,sy:number,ex:number,ey:number,progress:number,color:string){
 const point=(t:number)=>({x:sx+(ex-sx)*t,y:sy+(ey-sy)*t-Math.sin(t*Math.PI)*145});
 ctx.save();ctx.shadowColor=color;ctx.shadowBlur=8;ctx.strokeStyle=color+'33';ctx.lineWidth=1;ctx.beginPath();for(let j=0;j<=40;j++){const p=point(j/40);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.stroke();
 for(let i=0;i<24;i++){const t=progress-i*.019;if(t<0||t>1)continue;const p=point(t);ctx.globalAlpha=Math.max(.1,1-i/24);ctx.fillStyle=i%4===0?'#eaffff':color;ctx.fillRect(p.x-4,p.y-2,8,4);if(i%3===0){ctx.font='10px monospace';ctx.fillText(i%2?'01':'0x',p.x-6,p.y-9)}}
 ctx.globalAlpha=1;const p=point(Math.min(1,progress));ctx.strokeStyle=color;ctx.strokeRect(p.x-6,p.y-6,12,12);ctx.restore();
}

function draw(now:number){if(!shot){base();return}const s=shot,g=s.gun,f=g.family,t=(now-s.time)/s.scale,close=['melee','blade','punch','grapple','martial'].includes(f),color=s.p.color;
 const last=s.rounds.at(-1)!,end=last.delay+g.travel+(['grenade','rocket'].includes(f)?1100:650);
 let glow=0,recoil=0;for(const r of s.rounds){const age=t-r.delay-g.travel;if(s.hit&&s.mode!=='suppression'&&age>=0)glow=Math.max(glow,Math.max(0,1-age/400));if(t>=r.delay&&t<r.delay+120)recoil=-((g.recoil||4)*Math.sin((t-r.delay)/120*Math.PI))}
 base();if(done)return;if(glow>0){ctx.save();ctx.globalAlpha=glow*.25;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(target.x,target.y,options.targetRadius??28,0,Math.PI*2);ctx.stroke();ctx.restore()}
 if(s.mode==='suppression'){ctx.fillStyle=color+'12';ctx.fillRect(target.x-65,target.y-105,170,210);ctx.strokeStyle=color+'66';ctx.setLineDash([5,6]);ctx.strokeRect(target.x-65,target.y-105,170,210);ctx.setLineDash([])}
 for(const [index,r] of s.rounds.entries()){
  const age=t-r.delay;if(age<0)continue;const a=age/g.travel,impactAge=age-g.travel;
  const aimLength=Math.max(1,Math.hypot(target.x-source.x,target.y-source.y)),aimX=(target.x-source.x)/aimLength,aimY=(target.y-source.y)/aimLength;
  const sx=source.x+aimX*(options.sourceRadius??28),sy=source.y+aimY*(options.sourceRadius??28);
  const miss=!s.hit&&f!=='data',range=miss?(close?12:90):-(options.targetRadius??28),spread=s.mode==='suppression'?r.offset:miss?55:0;
  const ex=target.x+aimX*range-aimY*spread,ey=target.y+aimY*range+aimX*spread,dx=ex-sx,dy=ey-sy,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len;
  if(age<65&&['gun','shotgun','rocket'].includes(f))star(sx,sy,(g.flash||28)*(1-age/90),1-age/65,color,Math.atan2(uy,ux));
  if(a>=0&&a<1&&!s.reduced){ctx.save();ctx.shadowColor=color;ctx.shadowBlur=9;
   if(f==='data'){dataStream(sx,sy,ex,ey,a,color)}else if(f==='grapple'){ctx.strokeStyle=color;ctx.lineWidth=3;for(const offset of [-1,1]){ctx.beginPath();ctx.arc(ex,ey,24+8*offset,-1.4*offset,a*3*offset,offset<0);ctx.stroke()}}else if(f==='grenade'){const x=sx+dx*a,y=sy+dy*a-Math.sin(a*Math.PI)*150;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();line(x-4,y-8,x+4,y-8,color,3)}
   else if(f==='arrow'){const x=sx+dx*a,y=sy+dy*a-Math.sin(a*Math.PI)*20;line(x-ux*32,y-uy*32,x,y,color,2);line(x,y,x-ux*8-uy*4,y-uy*8+ux*4,color);line(x,y,x-ux*8+uy*4,y-uy*8-ux*4,color)}
   else{const pellets=f==='shotgun'?7:1;for(let j=0;j<pellets;j++){const spread=(j-(pellets-1)/2)*a*7,x=sx+dx*a,y=sy+dy*a+spread+(s.p.kind==='smart'?Math.sin(a*Math.PI)*20:0),tail=Math.min(g.tail||55,len*a);line(x-ux*tail,y-uy*tail,x,y,color,g.width||4);if(f==='rocket'){star(x-ux*12,y-uy*12,10,.8,'#ffb854');line(x-ux*45,y-uy*45,x-ux*15,y-uy*15,'#a1b6c066',8)}}}
   ctx.restore();
  }
  if(['melee','blade','punch','martial'].includes(f)&&a<1.4&&!s.reduced)closeStrike(ctx,f,ex,ey,Math.atan2(uy,ux),a,Math.max(.75,Math.min(1.8,(options.targetRadius??28)/28)),Math.floor(s.seed)%3);
  if(impactAge>=0&&impactAge<650&&(!close||s.hit)){const k=impactAge/650,explosive=['grenade','rocket'].includes(f),radius=explosive?(g.impact??18)*(.2+k*2):(g.impact??18)*(1-k);
   if(f==='data')digitalImpact(ex,ey,k,!s.hit?'#ff536c':color);else physicalImpact(ex,ey,k,color,s,ux,uy);
   if(!s.reduced){ctx.save();ctx.globalAlpha=1-k;ctx.strokeStyle=color;ctx.lineWidth=explosive?3:1.5;
    for(let j=0;j<(explosive?(g.sparks??0):0);j++){const angle=j*2.399+s.seed,dist=6+k*(explosive?160:55);line(ex+Math.cos(angle)*dist,ey+Math.sin(angle)*dist,ex+Math.cos(angle)*(dist+7),ey+Math.sin(angle)*(dist+7)+k*k*15,color)}
    if(s.p.kind==='fire'||explosive){for(let j=0;j<10;j++){ctx.fillStyle=explosive?'#82909a44':color+'88';ctx.beginPath();ctx.arc(ex+Math.sin(j*5)*k*35,ey-k*65+j%3*5,Math.max(1,4+k*12),0,Math.PI*2);ctx.fill()}}
    if(f==='blade')line(ex-20,ey+25*k,ex+20,ey-25*k,color,2);
    ctx.restore();}
  }
 }
 if(t<end)frame=requestAnimationFrame(draw);else{stop()}
}

frame=requestAnimationFrame(draw);return stop;
}
