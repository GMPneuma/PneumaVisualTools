import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:900,height:800}});
 await page.setContent(`<div id="pvt-audio-tools"><div class="window-content" style="width:660px"><div class="pvt-audio-panel"><section><div class="pvt-audio-track" data-track="s" data-playlist="p"><strong>Door</strong><div data-time></div><input data-seek-slider type="range"><div class="pvt-audio-buttons"><button data-action="back">−10s</button><button data-action="pause">Pause</button><input data-timestamp value="1:05"><button data-action="seek">Go</button></div></div></section><button data-mute="effects">Mute</button><input data-mixer="effects" type="range" value="0"><input data-search type="search"><div class="pvt-sound-grid"><div class="pvt-sound-cell" data-track="s" data-playlist="p"><button class="pvt-sound-tile" data-action="play" title="Metal door opening"><i>♪</i><span>Door</span></button></div></div></div></div></div>`);
 await page.addStyleTag({content:await readFile(new URL('../dist/pneuma-visualtools.css',import.meta.url),'utf8')});
 await page.evaluate(()=>{
  window.hooks={}; window.muted={}; window.values={ambience:1,effects:1,music:1,score:1}; window.calls=[];
  window.Application=class {render(){window.renderCalls=(window.renderCalls||0)+1;this.rendered=true;} async close(){this.rendered=false;} static get defaultOptions(){return {}} activateListeners(){} get element(){return [document.querySelector('#pvt-audio-tools')]} };
  window.PlaylistSound=class {sync(){if(this.sound)this.sound.loop=this.repeat;}};
  window.Hooks={on:(name,fn)=>hooks[name]=fn,once:(name,fn)=>hooks[name]=fn};
  window.foundry={utils:{getProperty:(obj,path)=>path.split('.').reduce((o,k)=>o?.[k],obj),mergeObject:(a,b)=>({...a,...b})}};
  window.CONST={PLAYLIST_MODES:{DISABLED:-1}};
  const effects=[];
  window.sound={playing:true,currentTime:30,duration:100,effects,volume:.7,context:{createGain:()=>({gain:{value:1}})},addEventListener(){},applyEffects(next){this.effects=next}};
  window.track={id:'s',name:'Door',path:'door.ogg',playing:true,pausedTime:null,flags:{'pneuma-visualtools':{soundDescription:'Metal door opening'}},sound,async update(data,options){window.lastUpdateOptions=options;calls.push(data);Object.assign(this,data);hooks.updatePlaylistSound?.(this,data,options);}};
  const tracks=new Map([['s',track]]); tracks.contents=[track];
  window.playlist={id:'p',name:'Effects',mode:-1,visible:true,flags:{'pneuma-visualtools':{includeSoundboard:true}},sounds:tracks,async playSound(){calls.push('play')},async stopSound(){calls.push('stop')},async stopAll(){calls.push('stop-all')}};
  window.bindings={};window.game={keybindings:{register:(_m,k,c)=>bindings[k]=c},user:{isGM:true},playlists:new Map([['p',playlist]]),settings:{get:(_m,k)=>k==='audioMuted'?muted:values,register(){},async set(_m,k,v){if(k==='audioMuted')muted=v;else values=v;}}};
  game.playlists[Symbol.iterator]=function*(){yield playlist;};
  playlist.sounds[Symbol.iterator]=function*(){yield track;};
  window.ui={notifications:{error:e=>calls.push(e)}};
 });
 const code=(await readFile(new URL('../dist/audio-tools.js',import.meta.url),'utf8')).replace(/^export /gm,'');
 await page.addScriptTag({content:code+'\nwindow.audio={Soundboard,audioTime,parseAudioTime,seekAudio,playSoundboardOnce,registerAudioTools,mountSidebarProgress,updateSidebarProgress};'});
 await page.evaluate(()=>{audio.registerAudioTools(); window.app=new audio.Soundboard(); app.activateListeners([document.querySelector('#pvt-audio-tools')]);});
 assert.equal(await page.evaluate(()=>audio.parseAudioTime('1:02:03')),3723);
 assert.equal(await page.evaluate(()=>audio.parseAudioTime('1:99')),null);
 assert.equal(await page.evaluate(()=>audio.audioTime(65)), '1:05');
 await page.evaluate(async()=>{bindings.toggleSoundboard.onDown();window.beforeSeekRenders=renderCalls;await audio.seekAudio(track,65);});
 assert.equal(await page.evaluate(()=>renderCalls),await page.evaluate(()=>beforeSeekRenders));
 assert.deepEqual(await page.evaluate(()=>lastUpdateOptions),{render:false,pvtSeek:true});
 assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[{playing:false,pausedTime:65},{playing:true,pausedTime:65}]); await page.evaluate(()=>{game.user.isGM=true; const form=document.createElement('form');form.innerHTML='<button type="submit">Save</button>';document.body.append(form);hooks.renderPlaylistConfig({object:playlist},[form]);hooks.renderPlaylistSoundConfig({object:track},[form]);window.form=form;});
 assert.equal(await page.evaluate(()=>form.querySelector('input[type=checkbox]').name),'flags.pneuma-visualtools.includeSoundboard');
 assert.equal(await page.evaluate(()=>form.querySelector('textarea')),null);
 assert.equal(await page.evaluate(()=>form.querySelector('[data-pvt-sound-image] input').closest('form')===form),true);
 await page.evaluate(()=>{
   const form2=document.createElement('form');form2.innerHTML='<select name="mode"><option value="-1">Soundboard Only</option><option value="0" selected>Sequential</option></select><button type="submit">Save</button>';document.body.append(form2);hooks.renderPlaylistConfig({object:playlist},[form2]);window.modeForm=form2;
 });
 assert.equal(await page.evaluate(()=>modeForm.querySelector('[data-pvt-include-soundboard]').hidden),true);
 assert.equal(await page.evaluate(()=>modeForm.querySelector('input').disabled),true);
 await page.evaluate(()=>{modeForm.querySelector('select').value='-1';modeForm.querySelector('select').dispatchEvent(new Event('change'));});
 assert.equal(await page.evaluate(()=>modeForm.querySelector('[data-pvt-include-soundboard]').hidden),false);
 assert.equal(await page.evaluate(()=>modeForm.querySelector('input').disabled),false);
 await page.evaluate(()=>{playlist.mode=0;});
 assert.equal(await page.evaluate(()=>app.getData().boards.length),0);
 await page.evaluate(()=>{playlist.mode=-1;});
 assert.equal(await page.evaluate(()=>app.getData().boards[0].sounds[0].description),'Metal door opening');
 await page.evaluate(()=>{track.description='Rmshot !';track.flags['pneuma-visualtools'].soundDescription='';});
 assert.equal(await page.evaluate(()=>app.getData().boards[0].sounds[0].description),'Rmshot !');
 await page.evaluate(()=>{playlist.flags['pneuma-visualtools'].includeSoundboard=false;}); assert.equal(await page.evaluate(()=>app.getData().boards.length),0);
 const box=await page.locator('.pvt-sound-tile').boundingBox(); assert.ok(Math.abs(box.width-box.height)<2);
 await page.screenshot({path:new URL('../docs/audio-tools-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
 await page.evaluate(()=>{
   const sidebar=document.createElement('div'); sidebar.innerHTML='<div id="currently-playing"><li class="sound" data-sound-id="s" data-playlist-id="p"><input class="sound-volume" type="range" min="0" max="1" step=".01" value=".7"></li></div>';document.body.append(sidebar);
   game.user.isGM=true;track.playing=true;sound.currentTime=30;audio.mountSidebarProgress(sidebar);audio.mountSidebarProgress(sidebar);
 });
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').count(),1);
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').inputValue(),'30');
 await page.focus('[data-pvt-sidebar-seek]');
 await page.evaluate(()=>{sound.currentTime=42;audio.updateSidebarProgress();});
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').inputValue(),'42');
 await page.evaluate(()=>{const slider=document.querySelector('[data-pvt-sidebar-seek]');slider.value='65';slider.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.waitForFunction(()=>!document.querySelector('[data-pvt-sidebar-seek]').dataset.seeking);
 assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[{playing:false,pausedTime:65},{playing:true,pausedTime:65}]);
 assert.equal(await page.locator('.sound-volume').inputValue(),'0.7');
 await page.evaluate(()=>{window.originalSeekNode=document.querySelector('[data-pvt-sidebar-seek]');sound.duration=undefined;sound.currentTime=undefined;track.pausedTime=65;audio.updateSidebarProgress();});
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').getAttribute('max'),'100');
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').inputValue(),'65');
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').isDisabled(),false);
 assert.equal(await page.evaluate(()=>document.querySelector('[data-pvt-sidebar-seek]')===originalSeekNode),true);
 await page.evaluate(()=>{sound.duration=100;sound.currentTime=42;audio.updateSidebarProgress();});
 await page.click('[data-pvt-sidebar-skip="-20"]');
 await page.waitForFunction(()=>!document.querySelector('[data-pvt-sidebar-seek]').dataset.seeking);
 assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[{playing:false,pausedTime:22},{playing:true,pausedTime:22}]);
 await page.click('[data-pvt-sidebar-skip="20"]');
 await page.waitForFunction(()=>!document.querySelector('[data-pvt-sidebar-seek]').dataset.seeking);
 assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[{playing:false,pausedTime:62},{playing:true,pausedTime:62}]);
 assert.equal(await page.locator('[data-pvt-sidebar-time]').count(),0);
 await page.evaluate(()=>{const slider=document.querySelector('[data-pvt-sidebar-seek]');slider.value='80';slider.dispatchEvent(new Event('input'));sound.currentTime=43;audio.updateSidebarProgress();});
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').inputValue(),'80');
 await page.evaluate(()=>{document.querySelector('[data-pvt-sidebar-seek]').dispatchEvent(new Event('blur'));audio.updateSidebarProgress();game.user.isGM=false;audio.updateSidebarProgress();});
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').inputValue(),'43');
 assert.equal(await page.locator('[data-pvt-sidebar-seek]').isDisabled(),true);
 await page.evaluate(()=>{
   const board=document.createElement('div');board.id='pvt-soundboard';board.style.width='220px';board.innerHTML='<div class="window-content"><h4>Effects</h4><div class="pvt-sound-grid"></div></div>';
   const grid=board.querySelector('.pvt-sound-grid');for(let i=0;i<7;i++){const cell=document.createElement('div');cell.className='pvt-sound-cell';cell.innerHTML='<button class="pvt-sound-tile" title="Metal door opening"><i>♪</i><span>Door '+i+'</span></button>';grid.append(cell);}document.body.append(board);
 });
 const tiles=await page.locator('#pvt-soundboard .pvt-sound-tile').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
 assert.equal(tiles[0].y,tiles[2].y);assert.ok(tiles[3].y>tiles[0].y);assert.ok(tiles[0].w<100);assert.ok(Math.abs(tiles[0].w-tiles[0].h)<2);
 assert.equal(await page.locator('#pvt-soundboard input').count(),0);
 const template=await readFile(new URL('../src/soundboard.hbs',import.meta.url),'utf8');assert.ok(!/data-mixer|data-seek|data-time|data-stop/.test(template));
 await page.evaluate(()=>{
   const parent={id:'parent',uuid:'Folder.parent',name:'Effects',color:'#456',folder:null};
   const child={id:'child',uuid:'Folder.child',name:'Doors',color:null,folder:parent};
   playlist.folder=child;playlist.flags['pneuma-visualtools'].includeSoundboard=true;game.folders={_expanded:{'Folder.child':true}};
   window.boardApp=new audio.Soundboard();
 });
 assert.deepEqual(await page.evaluate(()=>{const d=boardApp.getData();return {roots:d.folders.length,parent:d.folders[0].name,child:d.folders[0].children[0].name,sounds:d.folders[0].children[0].sounds.length,loose:d.loose.length,collapsed:d.folders[0].children[0].collapsed};}),{roots:1,parent:'Effects',child:'Doors',sounds:1,loose:0,collapsed:false});
 await page.evaluate(()=>{
   const container=document.querySelector('#pvt-soundboard .window-content');
   container.innerHTML='<ol class="directory-list"><li class="directory-item folder collapsed" data-uuid="Folder.child"><header class="folder-header" tabindex="0"><h3>Doors</h3></header><div class="folder-contents"><div class="pvt-sound-grid"><button class="pvt-sound-tile" title="Metal door opening">Door</button></div></div></li></ol>';
   ui.playlists={_toggleFolder(event){window.nativeFolderCalls=(window.nativeFolderCalls||0)+1;window.nativeThis=this===boardApp;const li=event.currentTarget.parentElement;li.classList.toggle('collapsed');game.folders._expanded[li.dataset.uuid]=!li.classList.contains('collapsed');}};
   boardApp.activateListeners([container]);
 });
 assert.equal(await page.locator('#pvt-soundboard .folder-contents').isVisible(),false);
 await page.click('#pvt-soundboard .folder-header');
 assert.equal(await page.locator('#pvt-soundboard .folder-contents').isVisible(),true);
 assert.equal(await page.evaluate(()=>nativeThis),true);
 await page.locator('#pvt-soundboard .folder-header').press('Enter');
 assert.equal(await page.locator('#pvt-soundboard .folder-contents').isVisible(),false);
 assert.equal(await page.evaluate(()=>nativeFolderCalls),2);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#pvt-soundboard')).backgroundColor),'rgba(12, 14, 18, 0.78)');
 await page.evaluate(async()=>{
   game.user.isGM=true;window.onceTrack=new PlaylistSound();
   Object.assign(onceTrack,{repeat:true,playing:false,flags:{},parent:{mode:-1},sound:{playing:true,loop:true,addEventListener(_type,fn){window.oncePlayListener=fn;}},async update(change){hooks.preUpdatePlaylistSound(this,change);for(const [key,value] of Object.entries(change)){if(key==='flags.pneuma-visualtools.soundboardOnce')this.flags['pneuma-visualtools']={soundboardOnce:value};else this[key]=value;}this.sync();}});
   await audio.playSoundboardOnce(onceTrack);
 });
 assert.equal(await page.evaluate(()=>onceTrack.sound.loop),false);
 assert.equal(await page.evaluate(()=>onceTrack.repeat),true);
 assert.equal(await page.evaluate(()=>onceTrack.pausedTime),null);
 await page.evaluate(()=>{onceTrack.sound.loop=true;oncePlayListener();});
 assert.equal(await page.evaluate(()=>onceTrack.sound.loop),false);
 await page.evaluate(async()=>{await onceTrack.update({playing:true});});
 assert.equal(await page.evaluate(()=>onceTrack.sound.loop),true);
 assert.equal(await page.evaluate(()=>onceTrack.repeat),true);
 await page.evaluate(()=>{const change={sounds:[{_id:'s',playing:true}]};hooks.preUpdatePlaylist(playlist,change);window.nativeChange=change;});
 assert.equal(await page.evaluate(()=>nativeChange.sounds[0]['flags.pneuma-visualtools.soundboardOnce']),false);
 await page.addStyleTag({content:'.directory .directory-item {width:100%;margin-left:8px}.directory .subdirectory {width:100%;padding-left:8px}.directory .directory-list {overflow:auto}'});
 await page.evaluate(()=>{
   const content=document.querySelector('#pvt-soundboard .window-content');content.innerHTML='<div class="pvt-simple-soundboard directory"><ol class="directory-list"></ol></div>';
   let list=content.querySelector('ol');
   for(let depth=0;depth<3;depth++){
     const folder=document.createElement('li');folder.className='directory-item folder';folder.innerHTML='<header class="folder-header"><h3>Folder</h3></header><div class="folder-contents"><div class="pvt-sound-grid"></div><ol class="subdirectory"></ol></div>';list.append(folder);
     const grid=folder.querySelector('.pvt-sound-grid');for(let i=0;i<6;i++){const cell=document.createElement('div');cell.className='pvt-sound-cell';cell.innerHTML='<button class="pvt-sound-tile"><span>Long sound effect name</span></button>';grid.append(cell);}list=folder.querySelector('ol');
   }
 });
 const widths=await page.locator('#pvt-soundboard .pvt-sound-grid').evaluateAll(nodes=>nodes.map(node=>({width:node.clientWidth,scroll:node.scrollWidth,right:node.lastElementChild.getBoundingClientRect().right,parentRight:node.parentElement.getBoundingClientRect().right})));
 assert.ok(widths.every(w=>w.scroll<=w.width && w.right<=w.parentRight+1));
 assert.ok(widths[2].width<widths[0].width);
 const overflow=await page.locator('#pvt-soundboard .directory-list, #pvt-soundboard .subdirectory').evaluateAll(nodes=>nodes.map(node=>node.scrollWidth<=node.clientWidth));
 assert.ok(overflow.every(Boolean));
 await page.evaluate(()=>{
   const board=document.querySelector('#pvt-soundboard');board.style.cssText='width:220px;height:320px;display:flex;flex-direction:column';
   const header=document.createElement('header');header.className='window-header';header.style.cssText='height:30px;flex:0 0 30px';header.textContent='VT-Soundboard';board.prepend(header);
 });
 assert.equal(await page.locator('#pvt-soundboard .window-content').evaluate(node=>node.scrollHeight>node.clientHeight),true);
 await page.locator('#pvt-soundboard .window-content').evaluate(node=>{node.scrollTop=node.scrollHeight;});
 assert.equal(await page.locator('#pvt-soundboard .window-content').evaluate(node=>node.scrollTop>0),true);
 assert.equal(await page.locator('#pvt-soundboard .window-content').evaluate(node=>node.scrollWidth<=node.clientWidth),true);
 console.log('Audio fixtures passed, including vertical scrolling and nested folders without horizontal overflow.');
} finally {await browser.close();}







