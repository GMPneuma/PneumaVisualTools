import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage();
  await page.setContent('<style>*{box-sizing:border-box}body{font:14px sans-serif}.chat-message{width:300px;margin:8px;background:#eee;border:1px solid #555}</style>');
  for(const file of ['chat-cards.css','chat-hub.css','chat-theme.css'])await page.addStyleTag({content:await readFile(new URL('../dist/'+file,import.meta.url),'utf8')});
  await page.evaluate(()=>{
    window.CONST={CHAT_MESSAGE_STYLES:{OTHER:0,OOC:1,IC:2,EMOTE:3},KEYBINDING_PRECEDENCE:{PRIORITY:0}};
    window.values={chatCards:true,chatSkin:'cyberpunk',chatPortraitSource:'actor',chatFallbackImage:'',chatDiceEnabled:false};
    window.configs={};window.Hooks={on:()=>{}};
    window.game={settings:{get:(_m,k)=>values[k],register:(_m,k,c)=>configs[k]=c},keybindings:{register:()=>{}},i18n:{localize:k=>k},user:{isGM:true,character:{img:'viewer-must-not-be-used.png'}},actors:new Map(),scenes:new Map()};
    window.ui={notifications:{error:message=>{throw Error(message);}}};
    window.MouseInteractionManager={LONG_PRESS_DURATION_MS:500};
    window.calls={sheet:0,ping:0,pan:0,lookups:0};window.sheetAllowed=true;window.pingAllowed=true;
    game.user.hasPermission=()=>pingAllowed;
    window.art=color=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76"><rect width="76" height="76" fill="'+color+'"/></svg>');
    window.images={actor:art('#569'),token:art('#954'),avatar:art('#495'),fallback:art('#945')};
    window.actor={uuid:'Actor.actor',documentName:'Actor',img:images.actor,prototypeToken:{texture:{src:images.token}},testUserPermission:()=>sheetAllowed,sheet:{render:()=>calls.sheet++},getActiveTokens:()=>[tokenDoc.object]};
    window.tokenDoc={uuid:'Scene.scene.Token.token',documentName:'Token',actor,texture:{src:images.token},parent:{id:'scene'},hidden:false};
    tokenDoc.object={document:tokenDoc,visible:true,center:{x:200,y:350}};
    window.canvas={ready:true,scene:{id:'scene'},animatePan:async point=>{assertPoint(point);calls.pan++;},ping:async point=>{assertPoint(point);calls.ping++;}};
    window.assertPoint=point=>{if(point.x!==200||point.y!==350)throw Error('Wrong token center');};
    window.fromUuidSync=uuid=>{calls.lookups++;return uuid===actor.uuid?actor:uuid===tokenDoc.uuid?tokenDoc:undefined;};
    game.actors.set('actor',actor);
    game.scenes.set('scene',{tokens:new Map([['token',tokenDoc]])});
    window.fixture=(id,changes={})=>{
      const root=document.createElement('article');root.id=id;root.className='chat-message';
      root.innerHTML='<header class="message-header"><h4 class="message-sender">Player</h4><span class="message-metadata"><time>Now</time></span></header><div class="message-content"><p>Ordinary chat text.</p></div>';
      const message={visible:true,isContentVisible:true,blind:false,isRoll:false,style:CONST.CHAT_MESSAGE_STYLES.OOC,speaker:{alias:'Player'},whisper:[],author:{id:'player',character:actor,avatar:images.avatar},...changes};
      document.body.append(root);renderChatCard(message,root);if(root.classList.contains('pneuma-chat-card'))arrangeChatCard(root,message);
      return root;
    };
  });
  const files=['chat-portrait-controls','weapon-silhouettes','chat-dice','exchange-header','chat-presentation','chat-cards'];
  const source=(await Promise.all(files.map(name=>readFile(new URL('../dist/'+name+'.js',import.meta.url),'utf8')))).map(text=>text.replace(/^import .*;\r?\n/gm,'').replace(/export /g,'')).join('\n');
  await page.addScriptTag({content:source});
  await page.evaluate(()=>registerChatCards());
  for(const skin of ['cyberpunk','technical']){
    await page.evaluate(skin=>{
      values.chatSkin=skin;
      for(const style of [CONST.CHAT_MESSAGE_STYLES.OOC,CONST.CHAT_MESSAGE_STYLES.IC,CONST.CHAT_MESSAGE_STYLES.EMOTE])fixture(skin+'-'+style,{style});
      fixture(skin+'-whisper',{whisper:['gm']});
      fixture(skin+'-explicit',{speaker:{actor:'actor'},author:{id:'other',avatar:images.avatar}});
      fixture(skin+'-avatar',{author:{id:'gm',character:null,avatar:images.avatar}});
      fixture(skin+'-system',{style:CONST.CHAT_MESSAGE_STYLES.OTHER});
      fixture(skin+'-roll',{isRoll:true});
      fixture(skin+'-blank',{author:{id:'missing',avatar:'icons/svg/mystery-man.svg'}});
      fixture(skin+'-hidden',{visible:false});
      game.user.isGM=false;fixture(skin+'-blind',{blind:true});game.user.isGM=true;
    },skin);
    const images=await page.evaluate(()=>window.images);
    for(const suffix of ['1','2','3','whisper','explicit']){
      assert.equal(await page.locator('#'+skin+'-'+suffix+' .pneuma-chat-portrait img').getAttribute('src'),images.actor);
    }
    assert.equal(await page.locator('#'+skin+'-avatar .pneuma-chat-portrait img').getAttribute('src'),images.avatar);
    for(const suffix of ['system','roll','blank','hidden','blind'])assert.equal(await page.locator('#'+skin+'-'+suffix+' .pneuma-chat-portrait img').count(),0);
    for(const width of [260,300,400]){
      await page.locator('#'+skin+'-1').evaluate(async(root,width)=>{
        root.style.width=width+'px';await root.querySelector('img').decode();
      },width);
      const layout=await page.locator('#'+skin+'-1').evaluate(root=>{
        const portrait=root.querySelector('.pneuma-chat-portrait img').getBoundingClientRect();
        const sender=root.querySelector('.message-sender').getBoundingClientRect();
        return {visible:portrait.width>0&&portrait.height>0,square:Math.abs(portrait.width-portrait.height)<1,below:sender.top>=portrait.bottom-1,fits:root.scrollWidth<=root.clientWidth};
      });
      assert.deepEqual(layout,{visible:true,square:true,below:true,fits:true});
    }
  }
  assert.equal(await page.evaluate(()=>calls.lookups),0,'ordinary portrait binding adds no UUID lookups');
  const portrait=page.locator('#technical-1 .pneuma-chat-portrait');
  assert.match(await portrait.getAttribute('title'),/Hold to ping.*Double-click.*Shift-click/);
  assert.equal(await portrait.getAttribute('aria-hidden'),null);
  assert.equal(await page.locator('#technical-avatar .pneuma-chat-portrait').getAttribute('role'),null,'avatar-only fallback remains decorative');
  await portrait.click();
  assert.deepEqual(await page.evaluate(()=>({...calls,lookups:0})),{sheet:0,ping:0,pan:0,lookups:0},'ordinary click is inert');
  await portrait.dblclick();
  assert.equal(await page.evaluate(()=>calls.sheet),1);
  await portrait.click({modifiers:['Shift']});
  assert.equal(await page.evaluate(()=>calls.pan),1);
  await portrait.hover();await page.mouse.down();await page.waitForTimeout(550);await page.mouse.up();
  assert.equal(await page.evaluate(()=>calls.ping),1);
  assert.equal(await page.evaluate(()=>calls.sheet),1,'hold does not open a sheet');
  await portrait.press('Enter');
  assert.equal(await page.evaluate(()=>calls.sheet),2);
  await page.evaluate(()=>{sheetAllowed=false;game.user.isGM=false;pingAllowed=false;});
  await portrait.dblclick();
  await portrait.hover();await page.mouse.down();await page.waitForTimeout(550);await page.mouse.up();
  assert.equal(await page.evaluate(()=>calls.sheet),2,'sheet permission is rechecked on use');
  assert.equal(await page.evaluate(()=>calls.ping),1,'ping permission is respected');
  await page.evaluate(()=>{tokenDoc.object.visible=false;pingAllowed=true;});
  await portrait.click({modifiers:['Shift']});
  assert.equal(await page.evaluate(()=>calls.pan),1,'players cannot pan to invisible tokens');
  await page.evaluate(()=>{tokenDoc.object.visible=true;game.user.isGM=true;canvas.scene.id='other';});
  await portrait.click({modifiers:['Shift']});
  assert.equal(await page.evaluate(()=>calls.pan),1,'does not navigate another scene');
  await page.evaluate(()=>{canvas.scene.id='scene';canvas.ready=false;});
  await portrait.click({modifiers:['Shift']});
  assert.equal(await page.evaluate(()=>calls.pan),1,'does not navigate an unready canvas');
  await page.evaluate(()=>{canvas.ready=true;sheetAllowed=true;});
  // Movement, early release, cancellation and detached cards must cancel holds.
  const holdEvent=(type,extra={})=>portrait.evaluate((element,{type,extra})=>element.dispatchEvent(new PointerEvent(type,{bubbles:true,button:0,clientX:10,clientY:10,...extra})),{type,extra});
  for(const [event,extra] of [['pointerup',{}],['pointerleave',{}],['pointercancel',{}],['pointermove',{clientX:30}]]){
    await holdEvent('pointerdown');await holdEvent(event,extra);await page.waitForTimeout(550);
  }
  assert.equal(await page.evaluate(()=>calls.ping),1,'cancelled holds do not ping');
  await page.evaluate(()=>{
    const root=fixture('detached');const portrait=root.querySelector('.pneuma-chat-portrait');
    portrait.dispatchEvent(new PointerEvent('pointerdown',{button:0}));root.remove();
  });
  await page.waitForTimeout(550);
  assert.equal(await page.evaluate(()=>calls.ping),1,'removed cards do not ping later');
  await page.evaluate(()=>{
    const root=fixture('defender-controls');
    root.querySelector('.pneuma-chat-identity').insertAdjacentHTML('beforeend','<span class="pneuma-exchange-defender">Target</span>');
    decorateRailDefender({visible:true,isContentVisible:true,blind:false,flags:{'pneuma-combattools':{exchange:{defender:tokenDoc.uuid}}}},root,{preference:'actor',fallback:'',choose:choosePortrait});
    calls.lookups=0;
  });
  const defender=page.locator('#defender-controls .pneuma-exchange-defender-image');
  await defender.dblclick();
  await defender.click({modifiers:['Shift']});
  assert.equal(await page.evaluate(()=>calls.sheet),3);
  assert.equal(await page.evaluate(()=>calls.pan),2,'defender uses its saved token reference');
  await page.evaluate(()=>{
    values.chatPortraitSource='token';fixture('token-preference',{speaker:{scene:'scene',token:'token'}});
    values.chatFallbackImage=images.fallback;fixture('configured-fallback',{author:{id:'none',avatar:'icons/svg/mystery-man.svg'}});
    values.chatSkin='off';fixture('off');
  });
  assert.equal(await page.locator('#token-preference .pneuma-chat-portrait img').getAttribute('src'),await page.evaluate(()=>images.token));
  assert.equal(await page.locator('#configured-fallback .pneuma-chat-portrait img').getAttribute('src'),await page.evaluate(()=>images.fallback));
  assert.equal(await page.locator('#off .pneuma-chat-portrait').count(),0);
  console.log('Chat portraits: both skins, artwork/visibility, hold ping, double-click sheet, Shift-click pan, keyboard access, inert single-click/avatar, live permissions, current visible tokens, hold cancellation, detached cards and defender references passed.');
}finally{await browser.close();}
