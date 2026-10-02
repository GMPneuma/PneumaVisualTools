import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { chromium } = await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || "playwright");
import { choosePortrait } from "../dist/chat-cards.js";
import { weaponSilhouette } from "../dist/weapon-silhouettes.js";
const weaponTypes = ['assaultRifle','bow','grenadeLauncher','heavyMelee','heavyPistol','heavySmg','lightMelee','martialArts','medMelee','medPistol','rocketLauncher','shotgun','smg','sniperRifle','thrownWeapon','unarmed','vHeavyMelee','vHeavyPistol'];
assert.equal(new Set(weaponTypes.map(type=>weaponSilhouette('Custom name',type))).size,18);
assert.equal(weaponSilhouette('Ranged weapon'),'');
assert.equal(weaponSilhouette('Unknown weapon'),'');

assert.equal(choosePortrait("token", "token.webp", "actor.webp", ""), "token.webp");
assert.equal(choosePortrait("actor", "token.webp", "actor.webp", ""), "actor.webp");
assert.equal(choosePortrait("token", "wild/*.webp", "actor.webp", ""), "actor.webp");
assert.equal(choosePortrait("token", "icons/svg/mystery-man.svg", null, ""), "");
assert.equal(choosePortrait("actor", null, null, "fallback.webp"), "fallback.webp");

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 700, height: 850 } });
  const headerSource = await readFile(new URL("../dist/exchange-header.js", import.meta.url), "utf8");
  const presentationSource = await readFile(new URL("../dist/chat-presentation.js", import.meta.url), "utf8");
  const silhouettes = await readFile(new URL("../dist/weapon-silhouettes.js", import.meta.url), "utf8");
  const stripSilhouetteImport = text => text.replace('import { weaponSilhouette } from "./weapon-silhouettes.js";', "");
  const source = (await readFile(new URL("../dist/chat-dice.js",import.meta.url),"utf8")) + silhouettes + stripSilhouetteImport(presentationSource).replace("import { replaceChatDice } from './chat-dice.js';", "") + stripSilhouetteImport(headerSource) + (await readFile(new URL("../dist/chat-cards.js", import.meta.url), "utf8")).replace('import { decorateExchangeHeader, decorateRailDefender } from "./exchange-header.js";', "").replace('import { arrangeChatCard, installRollPopovers } from "./chat-presentation.js";', "");
  const css = (await Promise.all(["pneuma-visualtools.css", "chat-cards.css", "chat-hub.css"].map(file => readFile(new URL("../dist/" + file, import.meta.url), "utf8")))).join("\n");
  await page.setContent('<style>:root{--cpr-background-chat-card-block:#c00000;--cpr-background-chat-card-block-before:#eee}*{box-sizing:border-box}body{font:14px sans-serif}.chat-message{list-style:none;width:300px;background:#ddd;margin:8px;padding:6px;border:1px solid #555}.hide{display:none}.d10-rollcard-data{display:grid;grid-template-areas:"dice total" "details details"}.d10-dice-div{grid-area:dice}.d10-number-div{grid-area:total}.d10-data-div{grid-area:details}.rollcard-subtitle{display:grid}.rollcard-subtitle-center{grid-area:subtitle-center}.rollcard-subtitle-right{grid-area:subtitle-right}</style>');
  await page.addStyleTag({ content: css });
  await page.addStyleTag({content:await readFile(new URL("../dist/chat-theme.css",import.meta.url),"utf8")});
  await page.evaluate(() => {
    window.values = {chatCards:true,chatPortraitSource:"token",chatFallbackImage:""};
    window.game = {
      keybindings:{register:(_m,k,config)=>{window.bindings??={};window.bindings[k]=config;}},
      settings:{set:async(_m,k,v)=>{await Promise.resolve();window.values[k]=v;window.registered[k].onChange?.(v);},get:(_m,k)=>window.values[k],register:(_m,k,v)=>{window.registered[k]=v;}},
      i18n:{localize:k=>k.split(".").pop()},user:{isGM:true},scenes:new Map(),actors:new Map()
    };
    window.registered = {};
    window.hooks = {};
    window.Hooks = {once:(n,f)=>{window.hooks[n]=f;},on:(n,f)=>{window.hooks[n]=f;}};
  });
  await page.addScriptTag({ type:"module", content:source + '\nwindow.arrangeChatCard=arrangeChatCard;window.installRollPopovers=installRollPopovers;window.renderChatCard=(message,root)=>{renderChatCard(message,root);if(root.classList.contains("pneuma-chat-card"))arrangeChatCard(root,message);};window.registerChatCards=registerChatCards;' });
  await page.waitForFunction(() => !!window.renderChatCard);
  await page.evaluate(() => {
    window.registerChatCards();
    // Foundry renders saved chat history before ready during a page reload.
    if (typeof window.hooks.renderChatMessage !== "function") throw new Error("Chat customization must be registered before initial chat history renders");
    const die = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><path fill="#642074" d="M40 0 80 40 40 80 0 40Z"/><text x="27" y="52" fill="#44ff55" font-size="36">8</text></svg>');
    window.fixture = (id, roll=true) => {
      const el=document.createElement("li"); el.id=id; el.className="chat-message";
      el.innerHTML='<header class="message-header"><h4 class="message-sender">Militech</h4><span class="message-metadata"><span class="chat-mode-indicator">Whisper</span><time class="message-timestamp">2m ago</time></span><span class="whisper-to">To: Pneuma, Pneuma2</span></header><div class="message-content">'+(roll?'<div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><div class="text-normal">Assault Rifle</div><div class="rollcard-subtitle"><span class="rollcard-subtitle-center">Attack · Basic</span><a class="clickable rollcard-subtitle-right" data-action="rollDamage" data-item-id="weapon">♦</a></div></div></div><div class="rollcard-bottom"><div class="cpr-block"><div class="d10-rollcard-data"><div class="d10-dice-div"><img src="'+die+'"><i>+</i><img src="'+die+'"></div><div class="d10-number-div"><span class="clickable" data-action="toggleVisibility" data-visible-element="d10-data-details">23</span></div><div class="d10-data-div"><div class="d10-data-details hide">REF + 5<br>Shoulder Arms + 10</div></div></div></div></div></div>':'Ordinary chat message.')+'</div>';
      document.body.append(el);
      // Native CPR chatListeners delegates against the whole message.
      el.addEventListener("click",event=>{
        const action=event.target.closest("[data-action]")?.dataset.action;
        if(action==="rollDamage") window.damageCalls=(window.damageCalls||0)+1;
        if(action==="toggleVisibility") el.querySelector(".d10-data-details").classList.toggle("hide");
      });
      return el;
    };
    window.msg={visible:true,blind:false,speaker:{},whisper:["u1","u2"],author:{id:"u1"}};
    window.hooks.renderChatMessage(window.msg,[window.fixture("roll")]);
    window.hooks.renderChatMessage(window.msg,[window.fixture("text",false)]);
  });
  assert.equal(await page.locator("#roll .pneuma-chat-portrait").count(),1);
  assert.equal(await page.locator("#text .pneuma-chat-portrait").count(),1);
  assert.equal(await page.locator("#roll .pneuma-chat-portrait img").count(),0);
  assert.equal(await page.locator("#roll .whisper-to").isVisible(),false);
  await page.locator("#roll .pneuma-chat-privacy").hover();
  assert.equal(await page.locator("#roll .whisper-to").isVisible(),true);
  assert.ok(await page.locator('#roll').evaluate(el=>{
    const tab=el.querySelector('.pneuma-chat-privacy').getBoundingClientRect();
    const rail=el.querySelector('.pneuma-participant-rail').getBoundingClientRect();
    const audience=el.querySelector('.whisper-to').getBoundingClientRect();
    return Math.abs(tab.width-rail.width)<=1 && Math.abs(audience.left-tab.right)<=1;
  }),'privacy fills rail and audience opens to its right');
  await page.locator("#roll .pneuma-chat-privacy").click();
  assert.equal(await page.locator("#roll .whisper-to").isVisible(),true);
  await page.locator("#roll .pneuma-chat-privacy").press("Enter");
  assert.equal(await page.locator("#roll .whisper-to").isVisible(),false);
  await page.locator("#roll [data-action=toggleVisibility]").click();
  assert.equal(await page.locator("#roll .d10-data-details").isVisible(),false);
  assert.match(await page.locator('#pneuma-roll-popover').innerText(), /REF/);
  await page.locator("#roll [data-action=rollDamage]").click();
  assert.equal(await page.evaluate(()=>window.damageCalls),1);
  for (const width of [260,300,400]) {
    await page.locator("#roll").evaluate((el,w)=>el.style.width=w+"px",width);
    const bounds=await page.locator("#roll .d10-dice-div img").evaluateAll(els=>els.map(el=>({y:el.getBoundingClientRect().y,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})));
    assert.equal(bounds[1].y-bounds[0].y,36,"critical dice offset vertically"); assert.equal(bounds[1].right-bounds[0].right,36,"critical dice offset horizontally");
    assert.ok(bounds.every(b=>b.width>0));
    assert.equal(await page.locator("#roll").evaluate(el=>el.scrollWidth<=el.clientWidth),true,"card must not overflow");
  }
  await page.evaluate(()=>{
    window.values.chatCards=false;
    window.hooks.renderChatMessage(window.msg,[window.fixture("disabled")]);
    window.values.chatCards=true;
    window.hooks.renderChatMessage({...window.msg,visible:false},[window.fixture("hidden")]);
    window.game.user.isGM=false;
    window.hooks.renderChatMessage({...window.msg,blind:true},[window.fixture("blind")]);
    window.game.user.isGM=true;
    window.renderChatCard(window.msg,document.querySelector("#roll"));
  });
  assert.equal(await page.locator("#disabled .pneuma-chat-portrait").count(),0);
  assert.equal(await page.locator("#disabled .message-content .rollcard-top").count(),1);
  assert.equal(await page.locator("#hidden .pneuma-chat-portrait").count(),0);
  assert.equal(await page.locator("#blind .pneuma-chat-portrait").count(),0);
  assert.equal(await page.locator("#roll .pneuma-chat-portrait").count(),1);
  assert.equal(await page.evaluate(()=>window.registered.chatFallbackImage.scope),"world");
  assert.equal(await page.evaluate(()=>window.registered.chatCards.default),true);
  await page.locator("#roll").evaluate(el=>el.style.width="300px");
  await page.locator("#roll").screenshot({path:new URL("../docs/chat-card-preview.png",import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1")});
  // Native CPR semantic color rules, alongside its inline result frame color.
  await page.addStyleTag({content:'.roll-success{color:var(--cpr-text-chat-success)}.roll-failure{color:var(--cpr-text-chat-failure)}'});
  await page.evaluate(()=>{
    for(const outcome of ['success','failure']) {
      const el=window.fixture(outcome,false);
      el.querySelector('.message-content').innerHTML='<div class="cpr-block" style="background-color: '+(outcome==='success'?'#608d3e':'#b52020')+'"><strong>Pex <span class="roll-'+outcome+'">'+(outcome==='success'?'hits':'misses')+'</span> Rage</strong><p>(DV: 16) Result</p></div>';
      window.renderChatCard(window.msg,el);
    }
  });
  for(const id of ['success','failure']) {
    const block=page.locator('#'+id+' .cpr-block');
    assert.equal(await block.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','inline frame color must not become solid panel');
    assert.equal(await page.locator('#'+id+' .roll-'+id).evaluate(el=>getComputedStyle(el).color),id==='success'?'rgb(54, 244, 111)':'rgb(255, 59, 69)');
    for(const width of [260,300,400]) {
      await page.locator('#'+id).evaluate((el,w)=>el.style.width=w+'px',width);
      assert.ok(await page.locator('#'+id).evaluate(el=>el.scrollWidth<=el.clientWidth));
    }
  }
  console.log('Inline success/failure frame-color regression and result widths passed.');
  await page.evaluate(()=>{
    const img='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><rect width="26" height="26" fill="#568899"/></svg>');
    window.fromUuidSync=uuid=>uuid==='Scene.s.Token.rage'?{documentName:'Token',hidden:false,texture:{src:img},actor:{img}}:null;
    window.exchangeMessage={...window.msg,flags:{'pneuma-combattools':{exchange:{attackerName:'Pex',defenderName:'Rage',title:'Assault Rifle',defender:'Scene.s.Token.rage'}}}};
    window.addExchange=(id,msg=window.exchangeMessage)=>{
      const el=window.fixture(id);
      el.classList.add('pneuma-combat-message');
      const roll=el.querySelector('.rollcard');
      const section=document.createElement('section'); section.className='pneuma-attack-result';
      roll.replaceWith(section); section.append(roll);
      window.renderChatCard(msg,el);
      return el;
    };
    window.addExchange('exchange');
    // Combat Tools can overwrite its original sender after this hook; our header is independent.
    const nativeSender=document.querySelector('#exchange .message-sender');if(nativeSender)nativeSender.textContent='Pex → Rage';
    window.renderChatCard(window.exchangeMessage,document.querySelector('#exchange'));
    window.addExchange('content-hidden',{...window.exchangeMessage,isContentVisible:false});
    window.addExchange('deleted-target',{...window.exchangeMessage,flags:{'pneuma-combattools':{exchange:{attackerName:'Pex',defenderName:'Rage',title:'Ranged weapon',defender:'Scene.s.Token.deleted'}}}});
    window.game.user.isGM=false;
    window.addExchange('exchange-blind',{...window.exchangeMessage,blind:true});
    window.fromUuidSync=()=>({documentName:'Token',hidden:true,texture:{src:img}});
    window.addExchange('hidden-target');
    window.game.user.isGM=true;
  });
  assert.equal(await page.locator('#exchange .pneuma-exchange-header').count(),1);
  assert.equal(await page.locator('#exchange .pneuma-exchange-attacker').textContent(),'Pex');
  assert.equal(await page.locator('#exchange .pneuma-exchange-weapon').textContent(),'Assault Rifle');
  assert.equal(await page.locator('#exchange .pneuma-exchange-defender').textContent(),'Rage');
  assert.equal(await page.locator('#exchange .pneuma-exchange-defender-image').count(),1);
  assert.equal(await page.locator('#exchange .message-sender').isVisible(),false);
  for(const id of ['content-hidden','exchange-blind','roll','text']) assert.equal(await page.locator('#'+id+' .pneuma-exchange-header').count(),0);
  for(const id of ['deleted-target','hidden-target']) assert.equal(await page.locator('#'+id+' .pneuma-exchange-defender-image').count(),0);
  assert.equal(await page.locator('#deleted-target .pneuma-exchange-weapon').textContent(),'Ranged weapon');
  await page.locator('#exchange [data-action=rollDamage]').click();
  assert.equal(await page.evaluate(()=>window.damageCalls),2);
  for(const width of [260,300,400]) {
    await page.locator('#exchange').evaluate((el,w)=>el.style.width=w+'px',width);
    assert.ok(await page.locator('#exchange').evaluate(el=>el.scrollWidth<=el.clientWidth),'exchange header overflow');
  }
  await page.locator('#exchange').evaluate(el=>el.style.width='300px');
  await page.locator('#exchange').screenshot({path:new URL('../docs/exchange-header-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  console.log('Exchange header: saved names/title, portrait, hook order, idempotence, private content, missing/hidden target, native isolation, controls and widths passed.');
  await page.evaluate(()=>{
    const art='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path fill="#a1b6c0" d="M0 12h80v-5h5v5h15v5H50l-8 18H30l4-18H18v10H0Z"/></svg>');
    window.values.hideAttackWeapon=false;
    window.fromUuidSync=()=>({documentName:'Token',hidden:false,texture:{src:art},actor:{img:art,testUserPermission:()=>true,items:new Map([['rifle',{name:'Very Long Assault Rifle',img:art}]])}});
    const data={...window.exchangeMessage.flags['pneuma-combattools'].exchange,attacker:'Scene.s.Token.pex',weaponId:'rifle',title:'Very Long Assault Rifle'};
    const msg={...window.exchangeMessage,flags:{'pneuma-combattools':{exchange:data}}};
    window.addExchange('weapon-art',msg);
    window.values.hideAttackWeapon=true;
    window.addExchange('weapon-hidden',msg);
    window.values.hideAttackWeapon=false;
    window.addExchange('weapon-concealed',{...msg,flags:{'pneuma-combattools':{exchange:{...data,title:'Ranged weapon'}}}});
    const aoe=window.fixture('area');
    aoe.querySelector('.rollcard').classList.add('pneuma-aoe-card');
    const attackSection=document.createElement('section');attackSection.className='pneuma-resolution-section pneuma-resolution-attack';
    const attackBottom=aoe.querySelector('.rollcard-bottom');attackBottom.replaceWith(attackSection);attackSection.append(attackBottom);
    const targets=document.createElement('div');targets.className='pneuma-aoe-targets';
    targets.textContent='Rage — Ignite On fire: 2 HP at turn end; nonstacking; Action to extinguish';
    aoe.querySelector('.rollcard').append(targets);
    window.renderChatCard(window.msg,aoe);
  });
  assert.equal(await page.locator('#weapon-art .pneuma-exchange-weapon-image').count(),1);
  assert.equal(await page.locator('#weapon-concealed .pneuma-exchange-weapon-image').count(),0);
  assert.equal(await page.locator('#weapon-hidden .pneuma-exchange-weapon-image').count(),1,'public saved title can select generic silhouette without item access');
  assert.equal(await page.locator('#weapon-art .pneuma-exchange-weapon').evaluate(el=>getComputedStyle(el).textAlign),'left');
  for(const width of [260,300,400]) {
    for(const id of ['weapon-art','area']) {
      await page.locator('#'+id).evaluate((el,w)=>el.style.width=w+'px',width);
      assert.ok(await page.locator('#'+id).evaluate(el=>el.scrollWidth<=el.clientWidth),id+' overflow');
    }
    const full=await page.locator('#area .pneuma-aoe-targets').boundingBox();
    const card=await page.locator('#area').boundingBox();
        assert.ok(full.width>card.width-25,'AoE targets must reclaim portrait rail width');
    const attack=await page.locator('#area .pneuma-resolution-attack').boundingBox();
    const identity=await page.locator('#area .pneuma-chat-identity').boundingBox();
    const portrait=await page.locator('#area .pneuma-chat-portrait').boundingBox();
    assert.ok(attack.x>=portrait.x+portrait.width,'AoE attack must sit beside rail');
    assert.ok(Math.abs(identity.x-portrait.x)<1,'AoE name and metadata must stay below portrait');
    assert.ok(identity.y>=portrait.y+portrait.height,'AoE identity must follow portrait');
    assert.ok(full.y>=attack.y+attack.height-1,'Full-width targets must follow attack');
  }
  for(const id of ['weapon-art','area']) {
    await page.locator('#'+id).evaluate(el=>el.style.width='300px');
    await page.locator('#'+id).screenshot({path:new URL('../docs/'+id+'-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  }
  console.log('Weapon artwork visibility/centering and full-width AoE layout passed.');
  await page.evaluate(()=>{
    const el=window.addExchange('split-top');
    const content=el.querySelector('.message-content');
    const wrapper=document.createElement('div'); wrapper.className='pneuma-resolution-card';
    wrapper.append(content.querySelector('.pneuma-attack-result'));
    for(const [cls,text] of [['pneuma-resolution-evade','Evasion 12'],['pneuma-resolution-result','Pex hits Rage'],['pneuma-damage-result','Damage 22 · Apply damage']]) {
      const section=document.createElement('section');section.className='pneuma-resolution-section '+cls;section.textContent=text;wrapper.append(section);
    }
    content.append(wrapper);window.installRollPopovers(el);
  });
  for(const width of [260,300,400]) {
    await page.locator('#split-top').evaluate((el,w)=>el.style.width=w+'px',width);
    const attack=await page.locator('#split-top .pneuma-attack-result').boundingBox();
    const identity=await page.locator('#split-top .pneuma-chat-identity').boundingBox();
    const card=await page.locator('#split-top').boundingBox();
    const defense=await page.locator('#split-top .pneuma-resolution-evade').boundingBox();
    assert.ok(Math.abs(defense.x-attack.x)<1 && Math.abs(defense.width-attack.width)<1,'opposed rolls share right frame');
    for(const cls of ['pneuma-resolution-result','pneuma-damage-result']) {
      const section=await page.locator('#split-top .'+cls).boundingBox();
      assert.ok(section.width>card.width-25,cls+' should span full width');
      assert.ok(section.y>=attack.y+attack.height-1,cls+' should follow the attack');
      assert.ok(section.y>=identity.y+identity.height-1,'identity rail must end before lower sections');
    }
    assert.ok(await page.locator('#split-top').evaluate(el=>el.scrollWidth<=el.clientWidth));
  }
  await page.locator('#split-top').evaluate(el=>el.style.width='300px');
  await page.locator('#split-top').screenshot({path:new URL('../docs/split-top-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  console.log('Single-target top-only rail and full-width lower sections passed at 260/300/400px.');
  // Model Foundry's stretching metadata defaults; skin must keep privacy badges compact.
  await page.addStyleTag({content:'.message-metadata{flex:1;align-items:stretch}.chat-mode-indicator{flex:1}'});
  for(const label of ['Blind','Self','Whisper']) {
    const badge=page.locator('#split-top .chat-mode-indicator');
    await badge.evaluate((el,text)=>el.textContent=text,label);
    const box=await badge.boundingBox();
    assert.ok(box.height<24,'privacy badge must stay text-height');
    assert.equal(await badge.evaluate(el=>getComputedStyle(el).textTransform),'uppercase');
    assert.equal(await badge.evaluate(el=>getComputedStyle(el).color),'rgb(216, 252, 255)');
    assert.ok(await page.locator('#split-top').evaluate(el=>el.scrollWidth<=el.clientWidth));
  }
  const rail=await page.locator('#split-top').evaluate(el=>{
    const style=getComputedStyle(el.querySelector('.pneuma-participant-rail'));
    return {clip:style.clipPath,width:parseFloat(style.width)};
  });
  assert.equal(rail.clip,'none','rail must not inherit decorative-frame clipping');
  assert.ok(rail.width===76,'rail must not protrude into attack column');
  await page.locator('#split-top').screenshot({path:new URL('../docs/split-top-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  console.log('Contained rail and prominent compact Blind/Self/Whisper badges passed.');
  await page.addStyleTag({content:await readFile(new URL('../../PneumaCombatTools/src/styles/pneuma-combattools.css',import.meta.url),'utf8')});
  await page.locator('#split-top .pneuma-resolution-result').evaluate(el=>{
    el.innerHTML='<p class="pneuma-combat-outcome"><button class="pneuma-result-damage pneuma-chat-button pneuma-chat-icon" data-action="rollDamage" data-chat-kind="action" aria-label="Roll damage"><i aria-hidden="true">♦</i></button><strong class="pneuma-result-summary">Pex <span class="pneuma-hit">hits</span> Rage</strong></p>';
  });
  const damageButton=page.locator('#split-top .pneuma-result-damage');
  assert.ok((await damageButton.evaluate(el=>getComputedStyle(el,'::after').content)).includes('Roll damage'));
  for(const width of [260,300,400]) {
    await page.locator('#split-top').evaluate((el,w)=>el.style.width=w+'px',width);
    const label=await page.locator('#split-top .pneuma-result-summary').boundingBox();
    const button=await damageButton.boundingBox();
    assert.ok(button.x>=label.x+label.width-1,'damage action should sit to the right');
    assert.ok(await page.locator('#split-top').evaluate(el=>el.scrollWidth<=el.clientWidth));
  }
  const calls=await page.evaluate(()=>window.damageCalls);
  await damageButton.click();assert.equal(await page.evaluate(()=>window.damageCalls),calls+1);
  await damageButton.evaluate(el=>{el.disabled=true;el.classList.add('pneuma-chat-busy')});
  assert.ok(await damageButton.isDisabled());
  assert.ok(!(await damageButton.evaluate(el=>getComputedStyle(el,'::after').content)).includes('Roll damage'),'busy spinner must not become label');
  await damageButton.evaluate(el=>{el.disabled=false;el.classList.remove('pneuma-chat-busy')});
  await page.locator('#split-top').evaluate(el=>el.style.width='300px');
  await page.locator('#split-top').screenshot({path:new URL('../docs/result-footer-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  console.log('Result footer label/layout, delegated damage action and busy state passed.');
  await page.locator('#split-top .message-content').evaluate(el=>{
    const recovery=document.createElement('section');recovery.className='pneuma-resolution-section pneuma-resolution-recovery';
    recovery.innerHTML='<h4 class="pneuma-resolution-label pneuma-resolution-recovery-label">Recovery</h4><div class="pneuma-resolution-body"><div class="pneuma-damage-recovery-controls"><button class="pneuma-chat-button" data-chat-role="gm" data-chat-kind="recovery"><i aria-hidden="true">⌁</i>Allow damage on miss</button></div></div>';
    el.append(recovery);
    el.querySelector('.pneuma-hit').className='pneuma-miss';el.querySelector('.pneuma-miss').textContent='misses';
  });
  for(const width of [260,300,400]) {
    await page.locator('#split-top').evaluate((el,w)=>el.style.width=w+'px',width);
    const card=await page.locator('#split-top').boundingBox();
    const recovery=await page.locator('#split-top .pneuma-resolution-recovery').boundingBox();
    const button=await page.locator('#split-top .pneuma-damage-recovery-controls button').boundingBox();
    assert.ok(recovery.width>card.width-25,'late recovery must span card');
    assert.ok(button.width>130&&button.height<55,'recovery label must remain horizontal');
    assert.ok(await page.locator('#split-top').evaluate(el=>el.scrollWidth<=el.clientWidth));
  }
  assert.equal(await page.locator('#split-top .pneuma-miss').evaluate(el=>getComputedStyle(el).color),'rgb(255, 59, 69)');
  await page.locator('#split-top').evaluate(el=>el.style.width='300px');
  await page.locator('#split-top').screenshot({path:new URL('../docs/recovery-footer-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  console.log('Late recovery full-width layout and vivid result colors passed.');
  assert.equal(await page.evaluate(()=>window.registered.chatSkin.default),'cyberpunk');
  assert.equal(await page.evaluate(()=>window.registered.chatSkin.scope),'client');
  assert.ok(await page.locator('#roll').evaluate(el=>el.classList.contains('pneuma-theme-cyberpunk')));
  await page.evaluate(()=>{
    window.values.chatSkin='technical';
    const theme=document.createElement('div');theme.id='technical-demo';
    theme.style.cssText='display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap;padding:12px';document.body.append(theme);
    for(const mode of ['light','dark']) {
      const col=document.createElement('div');col.id='theme-'+mode;
      col.style.cssText=mode==='light'?'--cpr-background-chat-card:#eaeaea;--cpr-text-chat-normal:#191919;--cpr-background-chat-card-block:#b90202;--cpr-background-chat-border:#b90202;--cpr-background-border:#b90202;--cpr-background-chat-card-block-before:#eaeaea;--cpr-text-chat-success:#287a35;--cpr-text-chat-failure:#b71924;':'--cpr-background-chat-card:#202329;--cpr-text-chat-normal:#eeeeee;--cpr-background-chat-card-block:#52606d;--cpr-background-chat-border:#52606d;--cpr-background-border:#52606d;--cpr-background-chat-card-block-before:#3b3b3b;--cpr-text-chat-success:#64d987;--cpr-text-chat-failure:#ff747e;';
      theme.append(col);
      const native=window.fixture('technical-native-'+mode);window.renderChatCard(window.msg,native);col.append(native);
      const exchange=window.addExchange('technical-exchange-'+mode);col.append(exchange);
      // Use the live structurally tested full exchange footer/recovery fixture.
      const full=document.querySelector('#split-top').cloneNode(true);full.id='technical-full-'+mode;
      full.classList.remove('pneuma-theme-cyberpunk');full.classList.add('pneuma-theme-technical');col.append(full);
      const area=document.querySelector('#area').cloneNode(true);area.id='technical-area-'+mode;
      area.classList.remove('pneuma-theme-cyberpunk');area.classList.add('pneuma-theme-technical');col.append(area);
    }
  });
  for(const mode of ['light','dark']) {
    const bg=mode==='light'?'rgb(234, 234, 234)':'rgb(32, 35, 41)';
    const ink=mode==='light'?'rgb(25, 25, 25)':'rgb(238, 238, 238)';
    for(const kind of ['native','exchange','full','area']) {
      const card=page.locator('#technical-'+kind+'-'+mode);
      const line=mode==='light'?'rgb(185, 2, 2)':'rgb(82, 96, 109)';
      assert.equal(await card.evaluate(el=>getComputedStyle(el).borderLeftColor),line,'native outer frame');
      assert.equal(await card.locator('.d10-number-div').first().evaluate(el=>getComputedStyle(el,'::before').backgroundColor),line,'native total frame');
      assert.equal(await card.evaluate(el=>getComputedStyle(el).backgroundColor),bg);
      assert.equal(await card.evaluate(el=>getComputedStyle(el).color),ink);
      assert.equal(await card.locator('.d10-number-div').first().evaluate(el=>getComputedStyle(el).color),ink);
      for(const width of [260,300,400]) {
        await card.evaluate((el,w)=>el.style.width=w+'px',width);
        assert.ok(await card.evaluate(el=>el.scrollWidth<=el.clientWidth),'technical '+kind+' overflow');
      }
      await card.evaluate(el=>el.style.width='300px');
    }
    const total=page.locator('#technical-native-'+mode+' [data-action=toggleVisibility]');
    await total.click();assert.ok(await page.locator('#technical-native-'+mode+' .d10-data-details').isVisible());
    const gm=page.locator('#technical-full-'+mode+' .pneuma-damage-recovery-controls button');
    assert.equal(await gm.evaluate(el=>getComputedStyle(el).color),ink);
    const roll=page.locator('#technical-full-'+mode+' .pneuma-result-damage');
    assert.equal(await roll.evaluate(el=>getComputedStyle(el).color),ink);
    await roll.evaluate(el=>{el.disabled=true;el.classList.add('pneuma-chat-busy')});
    await page.waitForFunction(id=>getComputedStyle(document.querySelector('#'+id+' .pneuma-result-damage')).color==='rgba(0, 0, 0, 0)','technical-full-'+mode);
    await roll.evaluate(el=>{el.disabled=false;el.classList.remove('pneuma-chat-busy')});
  }
  // Palette inheritance remains live; no captured/stale JS color values.
  await page.locator('#theme-light').evaluate(el=>el.style.setProperty('--cpr-background-chat-card','#dddccc'));
  assert.equal(await page.locator('#technical-native-light').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(221, 220, 204)');
  await page.locator('#theme-light').evaluate(el=>el.style.setProperty('--cpr-background-chat-card','#eaeaea'));
  await page.setViewportSize({width:750,height:1000});
  await page.locator('#technical-demo').screenshot({path:new URL('../docs/technical-skins-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  console.log('Both skins: selection, light/dark inherited palettes, native/exchange/AoE/recovery, widths, expansion, live palette updates and busy states passed.');
  const messagesBefore=await page.locator('.chat-message').count();
  const expandedBefore=await page.locator('#technical-native-light .d10-data-details').isVisible();
  await page.evaluate(()=>{window.values.chatSkin='cyberpunk';window.registered.chatSkin.onChange('cyberpunk')});
  assert.equal(await page.locator('#technical-native-light').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(12, 20, 26)');
  assert.equal(await page.locator('#technical-native-light .d10-data-details').isVisible(),expandedBefore);
  await page.evaluate(()=>{window.values.chatSkin='technical';window.registered.chatSkin.onChange('technical')});
  assert.equal(await page.locator('#technical-native-light').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(234, 234, 234)');
  assert.equal(await page.locator('.chat-message').count(),messagesBefore);
  assert.equal(await page.locator('#disabled').evaluate(el=>el.classList.contains('pneuma-theme-technical')),false);
  await page.locator('#technical-native-light [data-action=rollDamage]').click();
  const manifest=JSON.parse(await readFile(new URL('../dist/module.json',import.meta.url),'utf8'));
  assert.deepEqual(manifest.styles,['pneuma-visualtools.css','chat-cards.css','chat-hub.css','chat-theme.css','chat-dice.css']);
  const labels=JSON.parse(await readFile(new URL('../dist/en.json',import.meta.url),'utf8'));
  assert.equal(labels['PNEUMA_VISUALTOOLS.ChatSkinCyberpunk'],'Pneuma Hub');
  assert.equal(labels['PNEUMA_VISUALTOOLS.ChatSkinTechnical'],'Cyberpunk Minimal');
  console.log('Live skin switching using the separate manifest stylesheets preserves expanded details and nodes; labels verified.');
  const loaderSource=await readFile(new URL('../dist/chat-styles.js',import.meta.url),'utf8');
  await page.route('https://pneuma.test/**',route=>route.fulfill({contentType:'text/css',body:'/* stylesheet loading fixture */'}));
  await page.addScriptTag({type:'module',content:loaderSource+'\nwindow.ensureChatStyles=ensureChatStyles;'.replace('\\n','\n')});
  await page.waitForFunction(()=>typeof window.ensureChatStyles==='function');
  await page.evaluate(()=>{
    window.ensureChatStyles('https://pneuma.test/foundry/modules/pneuma-visualtools/main.js');
    window.ensureChatStyles('https://pneuma.test/foundry/modules/pneuma-visualtools/main.js');
  });
  for(const name of ['layout','hub','native']) assert.equal(await page.locator('link[data-pneuma-chat-style="'+name+'"]').count(),1);
  assert.equal(await page.locator('link[data-pneuma-chat-style="native"]').getAttribute('href'),'https://pneuma.test/foundry/modules/pneuma-visualtools/chat-theme.css');
  await page.evaluate(()=>{
    document.querySelector('link[data-pneuma-chat-style="native"]').remove();
    const link=document.createElement('link');link.rel='stylesheet';link.href='https://pneuma.test/foundry/modules/pneuma-visualtools/chat-theme.css?v=123';document.head.append(link);
    window.ensureChatStyles('https://pneuma.test/foundry/modules/pneuma-visualtools/main.js');
  });
  assert.equal(await page.locator('link[data-pneuma-chat-style="native"]').count(),0);
  console.log('Separate stylesheet fallback: missing asset registration, route prefix and duplicate avoidance passed.');
  await page.evaluate(async()=>{
    values.chatSkin='cyberpunk';registered.chatSkin.onChange('cyberpunk');
    const binding=bindings.cycleChatSkin,root=document.querySelector('#exchange'),node=root.querySelector('.pneuma-exchange-header');
    if(binding.repeat!==false||binding.restricted!==false)throw Error('Hotkey must be client accessible and not repeat while held');
    for(const expected of ['technical','cyberpunk']){
      if(!binding.onDown())throw Error('Hotkey not handled');
      await new Promise(resolve=>setTimeout(resolve,0));
      if(values.chatSkin!==expected||root.querySelector('.pneuma-exchange-header')!==node)throw Error('Cycle order or DOM preservation failed');
    }
    binding.onDown();binding.onDown();binding.onDown();binding.onDown();await new Promise(resolve=>setTimeout(resolve,0));
    if(values.chatSkin!=='cyberpunk')throw Error('Rapid hotkey presses lost a step');
    values.chatCards=false;if(binding.onDown()!==false)throw Error('Disabled chat styling consumed hotkey');values.chatCards=true;
  });
  console.log("Chat card checks passed: portrait selection/fallback, all-message header, recipients, native controls, widths, visibility, idempotence and master switch.");
  await page.evaluate(()=>{
    document.querySelector('#technical-native-light .d10-data-details').classList.add('hide');
    for(const card of document.querySelectorAll('.pneuma-chat-card')) { window.arrangeChatCard(card); window.installRollPopovers(card); }
  });
  const redesigned=page.locator('#technical-native-light');
  assert.equal(await redesigned.locator('.pneuma-card-meta .message-timestamp').count(),1);
  assert.equal(await redesigned.locator('.pneuma-participant-rail .pneuma-chat-portrait').count(),1);
  await redesigned.locator('.d10-number-div').first().hover();
  assert.match(await page.locator('#pneuma-roll-popover').innerText(),/REF/);
  assert.equal(await page.locator('#pneuma-roll-popover img').count(),0,'visible dice must not repeat in hover');
  assert.doesNotMatch(await page.locator('#pneuma-roll-popover').innerText(),/Result:/);
  await redesigned.locator('.d10-number-div').first().click();
  assert.equal(await redesigned.locator('.d10-data-div').isVisible(),false);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#pneuma-roll-popover').count(),0);
  await page.evaluate(()=>{
    const card=document.querySelector('#technical-native-light');
    card.insertAdjacentHTML('beforeend','<details class="pneuma-inline-roll"><summary>9</summary><div class="pneuma-inline-roll-details"><div class="dice-roll"><div class="dice-formula">1d10 + 4</div><div class="dice-tooltip" style="display:none">Die: 5 + 4</div></div></div></details>');
    window.installRollPopovers(card);
  });
  await redesigned.locator('.pneuma-inline-roll > summary').hover();
  assert.match(await page.locator('#pneuma-roll-popover').innerText(),/Die: 5/);
  await redesigned.locator('.pneuma-inline-roll > summary').click();
  assert.equal(await redesigned.locator('.pneuma-inline-roll').evaluate(el=>el.open),false);
  await redesigned.locator('.pneuma-inline-roll-details').evaluate(el=>{
    const frame=document.createElement('div'); frame.className='cpr-block';
    frame.style.background='rgb(200, 220, 200)';frame.style.border='6px solid red';
    frame.style.clipPath='polygon(10px 0,100% 0,100% 100%,0 100%,0 10px)';
    frame.append(...el.childNodes); el.append(frame);
  });
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>window.registered.chatSkin.onChange(skin),skin);
    await page.mouse.move(0,0);
    await redesigned.locator('.pneuma-inline-roll > summary').hover();
    const popupFrame=page.locator('#pneuma-roll-popover .cpr-block');
    assert.equal(await popupFrame.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
    assert.equal(await popupFrame.evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
    assert.equal(await popupFrame.evaluate(el=>getComputedStyle(el).clipPath),'none');
    assert.equal(await popupFrame.evaluate(el=>getComputedStyle(el,'::before').display),'none');
    assert.equal(await page.locator('#pneuma-roll-popover').evaluate(el=>getComputedStyle(el).backgroundColor),await redesigned.evaluate(el=>getComputedStyle(el).getPropertyValue('--pvt-bg').trim()).then(color=>page.evaluate(color=>{const el=document.createElement('div');el.style.color=color;document.body.append(el);const resolved=getComputedStyle(el).color;el.remove();return resolved},color)));
  }
  await page.evaluate(()=>{
    const card=document.querySelector('#technical-native-light');
    card.insertAdjacentHTML('beforeend','<div id="damage-complete" class="d6-rollcard-data"><div class="d6-dice-div">3 + 4</div><div class="d6-number-div"><span class="clickable" data-action="toggleVisibility">7</span></div><div class="d6-data-div"><div>Critical bonus: 5</div><div class="d6-data-details hide"> </div></div></div><div id="damage-modified" class="d6-rollcard-data"><div class="d6-dice-div">3 + 4</div><div class="d6-number-div">9</div><div class="d6-data-div"><div>Location: Body</div><div class="d6-data-details hide">Damage modifier: +2</div></div></div>');
    window.installRollPopovers(card);
  });
  await page.locator('#damage-complete .d6-number-div').hover();
  assert.equal(await page.locator('#pneuma-roll-popover').count(),0);
  assert.equal(await page.locator('#damage-complete [data-action="toggleVisibility"]').count(),0);
  assert.equal(await page.locator('#damage-complete .d6-data-div').isVisible(),true);
  await page.locator('#damage-modified .d6-number-div').hover();
  assert.equal(await page.locator('#pneuma-roll-popover').innerText(),'Damage modifier: +2');
  assert.equal(await page.locator('#damage-modified .d6-data-div').isVisible(),true);
  await page.evaluate(()=>{document.querySelector('#damage-complete').remove();document.querySelector('#damage-modified').remove()});
  for(const skin of ['cyberpunk','technical']) {
  await page.evaluate(skin=>{window.values.chatSkin=skin;window.registered.chatSkin.onChange(skin)},skin);
  for(const mode of ['light','dark']) for(const kind of ['native','exchange','full','area']) {
    const card=page.locator('#technical-'+kind+'-'+mode);
    for(const width of [260,300,400]) {
      await card.evaluate((el,w)=>el.style.width=w+'px',width);
      assert.ok(await card.evaluate(el=>el.scrollWidth<=el.clientWidth),'participant layout overflow '+kind);
      assert.ok(await card.evaluate(el=>{
        const rail=el.querySelector('.pneuma-participant-rail').getBoundingClientRect();
        const portrait=el.querySelector('.pneuma-chat-portrait').getBoundingClientRect();
        return Math.abs(rail.left-portrait.left)<1 && Math.abs(rail.top-portrait.top)<1 && Math.abs(rail.width-portrait.width)<=2;
      }),'portrait must fill rail without inset');
      if(kind==='full') assert.ok(await card.evaluate(el=>{
        const rail=el.querySelector('.pneuma-participant-rail').getBoundingClientRect();
        const result=el.querySelector('.pneuma-resolution-result').getBoundingClientRect();
        return rail.bottom<=result.top+1 && result.left<rail.right;
      }),'rail must end before full-width result');
    }
    await card.evaluate(el=>el.style.width='300px');
  }
  }
  await page.mouse.move(0,0);
  await page.locator('#technical-demo').screenshot({path:new URL('../docs/participants-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.evaluate(()=>{
    for(const [id,name] of [['name-spaces','Very Long Character Name'],['name-solid','VeryLongCharacterName']]) {
      const el=window.fixture(id); el.querySelector('.message-sender').textContent=name;
      window.hooks.renderChatMessage(window.msg,[el]);
    }
  });
  for(const id of ['name-spaces','name-solid']) {
    const name=page.locator('#'+id+' .pneuma-rail-name').first();
    assert.equal(await name.evaluate(el=>getComputedStyle(el).textAlign),'center');
    assert.ok(await name.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=11));
    assert.equal(await name.evaluate(el=>el.title===el.textContent.trim()),true);
  }
  assert.equal(await page.locator('#name-spaces .pneuma-rail-name-wrap').count(),1);
  assert.equal(await page.locator('#name-solid .pneuma-rail-name-wrap').count(),0);
  await page.evaluate(()=>{
    for(const action of ['Grab','Break Grapple','Choke','Throw','Release']) {
      const card=window.fixture('grapple-'+action.replaceAll(' ','-'),false);
      card.querySelector('.message-content').innerHTML=`<section class="pneuma-grapple-card"><div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><strong>${action}: Rage → Yam</strong></div></div><div class="rollcard-bottom"><p class="pneuma-grapple-note">Outcome remains here</p><button>Resolve</button></div></div></section>`;
      window.hooks.renderChatMessage(window.msg,[card]);
    }
    for(const thrown of [true,false]) {
      const card=window.fixture('grenade-'+thrown,false);
      card.querySelector('.message-content').innerHTML='<section class="rollcard pneuma-aoe-card"><div class="rollcard-top"><div class="cpr-block"><h3 class="pneuma-attack-name">Incendiary Grenade</h3></div></div><section class="pneuma-resolution-attack">Roll</section></section>';
      window.hooks.renderChatMessage({...window.msg,flags:{'pneuma-combattools':{aoe:{exchange:{...(thrown?{thrownSource:{}}:{})}}}}},[card]);
    }
    const card=window.fixture('private-netrunner',false);
    card.querySelector('.message-content').innerHTML='<div class="rollcard pneuma-quickhack-card"><div class="rollcard-top"><div class="cpr-block pneuma-quickhack-heading"><h3>Jack In</h3><p class="pneuma-quickhack-participants">Unknown Netrunner → Yam</p></div></div><p>Connection failed</p></div>';
    window.hooks.renderChatMessage(window.msg,[card]);
  });
  for (const action of ['Grab','Break Grapple','Release','Choke','Throw']) {
    assert.equal(await page.locator('#grapple-'+action.replaceAll(' ','-')+' .pneuma-rail-action').innerText(),action);
  }
  assert.equal(await page.locator('#grapple-Grab .message-sender').innerText(),'Rage');
  assert.equal(await page.locator('#grapple-Grab .pneuma-exchange-defender').innerText(),'Yam');
  assert.equal(await page.locator('#grapple-Grab .pneuma-grapple-card .rollcard-top').isVisible(),false);
  assert.equal(await page.locator('#grapple-Grab .pneuma-grapple-note').isVisible(),true);
  assert.equal(await page.locator('#grapple-Grab button').isVisible(),true);
  assert.equal(await page.locator('#grenade-true .pneuma-rail-action').innerText(),'Throw');
  assert.equal(await page.locator('#grenade-true .pneuma-exchange-defender').innerText(),'Grenade');
  assert.equal(await page.locator('#grenade-true .pneuma-attack-name').textContent(),'Incendiary');
  assert.equal(await page.locator('#grenade-false .pneuma-rail-action').innerText(),'Attack');
  for(const id of ['grenade-true','grenade-false']) {
    assert.equal(await page.locator('#'+id+' .pneuma-exchange-weapon-image').count(),1);
    assert.equal(await page.locator('#'+id+' .pneuma-silhouette-header').isVisible(),true);
    assert.match(await page.locator('#'+id+' .pneuma-exchange-weapon-image').evaluate(el=>el.style.maskImage),/weapon-grenade.webp/);
  }
  await page.evaluate(()=>{
    for(const [id,title,kind,area] of [['plain-grenade','Grenade','',true],['native-throw','Thrown Weapon','Throw',false],['native-melee','Heavy Melee','Attack',false]]) {
      const card=window.fixture(id,false);
      card.querySelector('.message-content').innerHTML=`<section class="rollcard ${area?'pneuma-aoe-card':''}"><div class="rollcard-top"><div class="cpr-block"><h3 class="pneuma-attack-name">${title}</h3><div class="rollcard-subtitle-center">${kind}</div></div></div><section class="pneuma-resolution-attack">Roll</section></section>`;
      window.hooks.renderChatMessage({...window.msg,flags:{'pneuma-combattools':{aoe:{exchange:{thrownSource:{}}}}}},[card]);
    }
  });
  for(const [id,asset] of [['plain-grenade','grenade'],['native-throw','thrown-weapon'],['native-melee','heavy-melee']]) {
    assert.equal(await page.locator('#'+id+' .pneuma-silhouette-header').isVisible(),true);
    assert.match(await page.locator('#'+id+' .pneuma-exchange-weapon-image').evaluate(el=>el.style.maskImage),new RegExp('weapon-'+asset+'.webp'));
  }
  assert.equal(await page.locator('#private-netrunner .message-sender').innerText(),'Unknown Netrunner');
  assert.equal(await page.locator('#private-netrunner .pneuma-rail-action').innerText(),'Jack In');
  assert.equal(await page.locator('#grapple-Grab .pneuma-exchange-defender-image').count(),1);
  assert.equal(await page.locator('#grapple-Grab .pneuma-rail-arrow').count(),2);
  assert.equal(await page.locator('#grapple-Grab .pneuma-exchange-defender').evaluate(el=>el.nextElementSibling.classList.contains('pneuma-exchange-defender-image')),true);
  assert.equal(await page.locator('#grenade-true .pneuma-exchange-defender-image').count(),0,'grenade is not a defending actor');
  await page.evaluate(()=>{
    const card=window.fixture('big-damage');window.hooks.renderChatMessage(window.msg,[card]);
    const group=document.createElement('div');group.className='d6-dice-div';group.id='balanced-test';group.style.width='230px';
    card.querySelector('.message-content').append(group);
  });
  for(const count of [3,5,6,7,11,13]) {
    await page.evaluate(async count=>{
      const group=document.querySelector('#balanced-test');group.replaceChildren();
      for(let n=0;n<count;n++){const img=document.createElement('img');img.src=document.querySelector('#roll .d10-dice-div img').src;group.append(img)}
      window.installRollPopovers(document.querySelector('#big-damage'));
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    },count);
    const rows=await page.locator('#balanced-test img').evaluateAll(images=>{
      const counts={};for(const image of images)counts[image.style.gridRow]=(counts[image.style.gridRow]??0)+1;return Object.values(counts);
    });
    assert.ok(Math.max(...rows)-Math.min(...rows)<=1,'balanced row counts');
    assert.ok(Math.max(...rows)<=5,'maximum five dice per row');
    if(count===6)assert.deepEqual(rows,[3,3]);
    if(count===7)assert.deepEqual(rows,[4,3]);
    assert.ok(await page.locator('#balanced-test img').first().evaluate(el=>el.getBoundingClientRect().width>=40),'damage dice are larger');
  }
  console.log('Defender portrait order, arrows, and large balanced damage dice passed.');  console.log('Action rails: grapple family, thrown versus launched grenade, and concealed quickhack participants passed.');  console.log('Participant rail, metadata, native and compact hover breakdowns, name fitting and narrow widths passed.');


  // Regression: real defense disclosure naming and late appended effects/results.
  await page.evaluate(()=>{
    const card=window.addExchange('complete-exchange');
    const content=card.querySelector('.message-content');
    const attack=content.querySelector('.pneuma-attack-result');
    attack.classList.add('pneuma-resolution-attack','pneuma-roll-winner');
    const ammo=document.createElement('span');ammo.className='rollcard-subtitle-2-center';ammo.textContent='Smart';attack.querySelector('.rollcard-subtitle').append(ammo);
    const defense=attack.cloneNode(true);defense.className='pneuma-resolution-section pneuma-resolution-evade pneuma-defense-result pneuma-roll-loser';
    defense.querySelector('.rollcard-top').innerHTML='<div class="cpr-block"><div class="text-normal">Evasion</div></div>';
    defense.querySelector('.d10-data-details').classList.replace('d10-data-details','pneuma-defense-d10-data-details');
    defense.querySelector('[data-visible-element]').dataset.visibleElement='pneuma-defense-d10-data-details';
    defense.querySelector('.pneuma-defense-d10-data-details').textContent='DEX + 6 / Evasion + 2 / Total Mods: -2';
    defense.querySelector('.d10-number-div span').textContent='8';
    const wrapper=document.createElement('div');wrapper.className='pneuma-resolution-card';wrapper.append(attack,defense);content.append(wrapper);window.installRollPopovers(card);
    window.hooks.renderChatMessage(window.exchangeMessage,[card]);
    const effects=document.createElement('section');effects.className='pneuma-attached-effects rollcard';effects.innerHTML='<h4>Rage — Effects</h4><div class="pneuma-instant-effect"><strong>Biotoxin DV15</strong> <button data-instant-action="resist">Resist</button> <button>Unaffected</button></div>';
    const application=document.createElement('div');application.className='pneuma-damage-result';application.innerHTML='<div class="pneuma-damage-heading">Damage <span class="pneuma-damage-ammo">Smart</span></div><div class="rollcard pneuma-damage-applied"><div class="pneuma-damage-applied-row"><span>Rage</span> <span class="pneuma-applied-number" data-action="toggleVisibility" data-visible-element="pneuma-applied-details-case">6</span> Body</div><div class="pneuma-applied-details pneuma-applied-details-case hide">Damage rolled 15 / Armor SP 9 / HP reduced 6<a data-action="reverseDamage" title="Reverse damage">Undo</a></div></div>';
    wrapper.append(application);content.append(effects);
  });
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>window.registered.chatSkin.onChange(skin),skin);
    for(const width of [260,300,400]) {
      await page.locator('#complete-exchange').evaluate((el,w)=>el.style.width=w+'px',width);
      const card=await page.locator('#complete-exchange').boundingBox();
      for(const selector of ['.pneuma-attached-effects','.pneuma-damage-result']) {
        const bounds=await page.locator('#complete-exchange '+selector).boundingBox();
        assert.ok(bounds.width>card.width-35,selector+' must span card at '+width);
      }
      assert.ok(await page.locator('#complete-exchange').evaluate(el=>el.scrollWidth<=el.clientWidth),'complete card overflow');
      const sizes=await page.locator('#complete-exchange').evaluate(el=>['.pneuma-attack-result','.pneuma-defense-result'].map(sel=>{
        const section=el.querySelector(sel);return [section.querySelector('.d10-dice-div img').getBoundingClientRect().width,getComputedStyle(section.querySelector('.d10-number-div')).fontSize,section.querySelector('.d10-number-div').getBoundingClientRect().width,section.querySelector('.d10-number-div').getBoundingClientRect().height];
      }));
      assert.deepEqual(sizes[0],sizes[1],'attack/evasion dice and totals equal');
      const opposed=await page.locator('#complete-exchange').evaluate(el=>{
        const attack=el.querySelector('.pneuma-attack-result').getBoundingClientRect();
        const defense=el.querySelector('.pneuma-defense-result').getBoundingClientRect();
        return {sameLeft:Math.abs(attack.left-defense.left)<1,sameWidth:Math.abs(attack.width-defense.width)<1,below:defense.top>=attack.bottom};
      });
      assert.ok(opposed.sameLeft&&opposed.sameWidth&&opposed.below,'attack and defense share the right-hand area');
      assert.equal(sizes[0][2],46,'main total width');assert.equal(sizes[0][3],46,'main total height');
      assert.equal(await page.locator('#complete-exchange .pneuma-participant-rail').evaluate(el=>el.getBoundingClientRect().width),76);
    }
    assert.equal(await page.locator('#complete-exchange .pneuma-attack-result .rollcard-subtitle-2-center').isVisible(),false);
    assert.equal(await page.locator('#complete-exchange .pneuma-damage-ammo').isVisible(),true);
    await page.locator('#complete-exchange .pneuma-defense-result .d10-number-div').scrollIntoViewIfNeeded();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.locator('#complete-exchange .pneuma-defense-result .d10-number-div').hover();
    assert.match(await page.locator('#pneuma-roll-popover').innerText(),/DEX \+ 6/);
    assert.equal(await page.locator('#pneuma-roll-popover img').count(),0,'visible defense dice are not repeated');
    await page.locator('#complete-exchange .pneuma-applied-number').scrollIntoViewIfNeeded();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.locator('#complete-exchange .pneuma-applied-number').hover();
    assert.match(await page.locator('#pneuma-roll-popover').innerText(),/Armor SP 9/);
    assert.equal(await page.locator('#complete-exchange [data-action="reverseDamage"]').isVisible(),true,'undo remains usable');
    assert.equal(await page.locator('#complete-exchange .pneuma-applied-details').isVisible(),false);
  }
  await page.evaluate(()=>window.registered.chatSkin.onChange('cyberpunk'));
  await page.addStyleTag({content:'.chat-message .d10-number-div, .chat-message .d10-number-div > span {color:#b90202 !important;}'});
  const frameColors=await page.locator('#complete-exchange').evaluate(el=>['.pneuma-roll-winner','.pneuma-roll-loser'].map(sel=>{
    const total=el.querySelector(sel+' .d10-number-div');return [getComputedStyle(total,'::before').backgroundColor,getComputedStyle(total).color];
  }));
  assert.equal(frameColors[0][0],'rgb(69, 203, 131)');assert.equal(frameColors[1][0],'rgb(230, 93, 109)');assert.equal(frameColors[0][1],'rgb(85, 220, 231)','Hub winning total stays cyan');assert.equal(frameColors[1][1],'rgb(85, 220, 231)','Hub losing total stays cyan');
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(s=>registered.chatSkin.onChange(s),skin);
    for(const [state,label,fill] of [['winner','WINNER','rgb(23, 107, 66)'],['loser','LOSER','rgb(161, 43, 58)']]) {
      const total=page.locator('#complete-exchange .pneuma-roll-'+state+' .d10-number-div');
      assert.notEqual(await total.evaluate(el=>getComputedStyle(el,'::after').content),JSON.stringify(label));
      assert.equal(await total.evaluate(el=>getComputedStyle(el,el.closest('.pneuma-theme-technical')?'::after':'::before').backgroundColor),skin==='technical'?'rgb(238, 238, 238)':state==='winner'?'rgb(69, 203, 131)':'rgb(230, 93, 109)');
      assert.equal(await total.evaluate(el=>getComputedStyle(el).color),skin==='technical'?'rgb(25, 25, 25)':'rgb(85, 220, 231)');
    }
  }
  await page.evaluate(()=>registered.chatSkin.onChange('cyberpunk'));
  await page.locator('#complete-exchange').evaluate(el=>el.style.width='350px');
  await page.mouse.move(690,0);
  await page.locator('#complete-exchange').screenshot({path:new URL('../docs/complete-exchange-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  // AoE also flattens its content; late siblings must not fall into its rail.
  await page.evaluate(()=>{
    const card=document.querySelector('#area');window.arrangeChatCard(card);
    const effect=document.createElement('section');effect.className='pneuma-attached-effects';effect.textContent='Late AoE effects';card.querySelector('.message-content').append(effect);
  });
  assert.ok(await page.locator('#area').evaluate(el=>el.querySelector('.pneuma-attached-effects').getBoundingClientRect().width>el.getBoundingClientRect().width-35));
  // Native applied damage puts the disclosure under cpr-block, not roll-data.
  await page.evaluate(()=>{
    const root=window.fixture('native-application',false);
    root.querySelector('.message-content').innerHTML='<div class="rollcard"><div class="cpr-block"><div class="d6-number-div"><span data-action="toggleVisibility" data-visible-element="d6-data-details">6</span></div><div class="d6-data-div"><div class="d6-data-details hide">Armor SP 9 / HP reduced 6<a data-action="reverseDamage">Undo</a></div></div></div></div>';
    window.hooks.renderChatMessage(window.msg,[root]);
  });
  await page.locator('#native-application .d6-number-div').scrollIntoViewIfNeeded();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.locator('#native-application .d6-number-div').hover();
  assert.match(await page.locator('#pneuma-roll-popover').innerText(),/Armor SP 9/);
  assert.equal(await page.locator('#native-application [data-action="reverseDamage"]').isVisible(),true);
  console.log('Full-width effects including AoE, scoped evasion/native/applied-damage hovers, undo preservation, equal dice, outcome frames and ammo stage visibility passed.');

  await page.route('**/icons/dice/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42"><rect width="42" height="42" fill="purple"/></svg>'}));
  await page.evaluate(()=>{
    const base=document.createElement('base');base.href='http://fixture.test/';document.head.append(base);
    const card=window.fixture('mini-results',false);
    const roll=(value,label,html)=>`<details class="pneuma-inline-roll"><summary aria-label="${label} — show roll details">${value}</summary><div class="pneuma-inline-roll-details">${html}</div></details>`;
    const generic='<div class="dice-roll"><div class="dice-formula">3d6</div><div class="dice-tooltip" style="display:none"><section class="tooltip-part"><div class="part-header">3d6 <span>6</span></div><ol class="dice-rolls"><li class="roll die d6 min">1</li><li class="roll die d6">2</li><li class="roll die d6">3</li></ol></section></div><h4 class="dice-total">6</h4></div>';
    card.querySelector('.message-content').innerHTML='<div class="pneuma-instant-effect" data-state="applied" data-effect="poison"><strong>Poison DV13</strong> '+roll(9,'Resist Torture/Drugs','REF + 4; die 5')+' <span>6 direct HP damage; armor unchanged</span><span>Damage</span>'+roll(6,'Damage roll',generic)+'</div><div class="pneuma-instant-effect" data-state="resisted" data-effect="sleep"><strong>Sleep DV13</strong>'+roll(19,'Resist Torture/Drugs','Die 9 + 10')+'<span>Resisted</span></div><div class="pneuma-aoe-target" data-state="miss"><span>Rage</span><div class="pneuma-aoe-response">'+roll(18,'Evasion','Die 8 + 10')+'<button data-aoe-action="reset">Reset</button></div></div>';
    window.hooks.renderChatMessage(window.msg,[card]);
    window.installRollPopovers(card);window.installRollPopovers(card);
  });
  assert.equal(await page.locator('#mini-results .pneuma-mini-result-row').count(),4,'adapter stays idempotent');
  for (const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>window.registered.chatSkin.onChange(skin),skin);
    for(const width of [260,300,400]) {
      await page.locator('#mini-results').evaluate((el,w)=>el.style.width=w+'px',width);
      const rows=await page.locator('#mini-results .pneuma-mini-result-row').evaluateAll(rows=>rows.map(row=>{
        const result=row.querySelector('summary'); const box=result.getBoundingClientRect();
        return {width:box.width,height:box.height,right:box.right,rowRight:row.getBoundingClientRect().right,color:getComputedStyle(result).color};
      }));
      for(const row of rows){assert.equal(row.width,32);assert.equal(row.height,32);assert.ok(Math.abs(row.right-row.rowRight)<1);}
      assert.equal(rows[0].color,skin==='technical'?'rgb(183, 25, 36)':'rgb(255, 53, 77)');assert.equal(rows[1].color,skin==='technical'?'rgb(25, 25, 25)':'rgb(85, 220, 231)');assert.equal(rows[2].color,skin==='technical'?'rgb(40, 122, 53)':'rgb(32, 238, 121)');
      assert.ok(await page.locator('#mini-results').evaluate(el=>el.scrollWidth<=el.clientWidth));
    }
  }
  assert.match(await page.locator('#mini-results').innerText(),/Resist Poison DV13/);
  assert.doesNotMatch(await page.locator('#mini-results').innerText(),/armor unchanged/);
  const damage=page.locator('#mini-results [data-effect="poison"] .pneuma-mini-result-row').nth(1).locator('summary');
  await damage.scrollIntoViewIfNeeded();await damage.hover();
  assert.match(await page.locator('#pneuma-roll-popover').innerText(),/6 direct HP damage; armor unchanged/);
  assert.equal(await page.locator('#pneuma-roll-popover .d6-dice-div img').count(),3);
  assert.equal(await page.locator('#pneuma-roll-popover .dice-rolls').count(),0);
  assert.match(await page.locator('#pneuma-roll-popover img').first().getAttribute('src'),/black\/d6_1.svg$/);
  await page.evaluate(()=>{window.values.chatDiceEnabled=true;window.values.chatDiceSet='pneuma';});
  await page.mouse.move(0,0);await damage.focus();
  assert.match(await page.locator('#pneuma-roll-popover img').first().getAttribute('src'),/dice-pneuma-d6_1.webp$/);
  await page.locator('#mini-results [data-aoe-action="reset"]').click();
  await page.evaluate(()=>window.registered.chatSkin.onChange('cyberpunk'));
  await page.mouse.move(0,0);await damage.evaluate(el=>el.blur());
  await page.locator('#mini-results').screenshot({path:new URL('../docs/mini-results-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  // Multiple native receipts stay separated from the shared roll, with notes
  // attached to their recipient and native Undo on the same result row.
  await page.evaluate(() => {
    const card=window.fixture('damage-receipts',true);
    const applications=document.createElement('div');
    applications.className='pneuma-damage-applications pneuma-aoe-applications';
    applications.innerHTML=['Rage','Smitty','Yamm itation','Calli'].map((name,index)=>
      `<div class="rollcard pneuma-damage-applied"><div class="pneuma-damage-applied-row"><span class="pneuma-applied-name">${name}</span><span class="pneuma-applied-number" data-action="toggleVisibility" data-visible-element="receipt-${index}">${22-index}</span><span class="pneuma-applied-location">Body</span></div><div class="pneuma-applied-details receipt-${index} hide">Armor SP 9<a data-action="reverseDamage">↶</a></div></div>`
      +(index>1?'<p class="pneuma-cover-up-damage">Cover Up: armor SP ×2; all worn head and body armor ablates ×2, including blocked damage.</p>':'' )).join('');
    card.querySelector('.message-content').append(applications);
    window.hooks.renderChatMessage(window.exchangeMessage,[card]);
    window.installRollPopovers(card);window.installRollPopovers(card);
  });
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>window.registered.chatSkin.onChange(skin),skin);
    for(const width of [260,300,400]) {
      await page.locator('#damage-receipts').evaluate((el,w)=>el.style.width=w+'px',width);
      const geometry=await page.locator('#damage-receipts').evaluate(card=>{
        const applications=card.querySelector('.pneuma-aoe-applications');
        return {border:getComputedStyle(applications).borderTopWidth,overflow:card.scrollWidth>card.clientWidth,
          notes:applications.querySelectorAll(':scope > .pneuma-cover-up-damage').length,
          rows:Array.from(applications.querySelectorAll('.pneuma-damage-applied-row')).map(row=>{
            const total=row.querySelector('.pneuma-applied-number').getBoundingClientRect();
            const undo=row.querySelector('[data-action="reverseDamage"]').getBoundingClientRect();
            return undo.top>=total.top&&undo.bottom<=total.bottom;
          })};
      });
      assert.equal(geometry.border,'1px');assert.equal(geometry.overflow,false);
      assert.equal(geometry.notes,0);assert.ok(geometry.rows.every(Boolean),'Undo stays beside its receipt total');
    }
  }
  await page.locator('#damage-receipts').screenshot({path:new URL('../docs/damage-receipts-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  console.log('Mini result rows, outcome colors, saved damage dice, armor hover, controls and two-skin widths passed.');
  await page.evaluate(()=>{
    const chat=document.createElement('section');chat.id='composer-check';chat.style.cssText='width:300px;padding:8px;background:#080f14';
    chat.innerHTML='<div id="chat-controls"><select aria-label="Roll mode"><option>Public Roll</option><option>Private GM Roll</option></select><a tabindex="0" aria-label="Dice">⚄</a></div><form id="chat-form"><textarea id="chat-message" rows="4" placeholder="Type a message…"></textarea></form>';
    document.body.append(chat);window.hooks.renderChatLog({},[chat]);
  });
  await page.locator('#chat-message').fill('Draft message /roll 1d10');
  await page.locator('#chat-controls select').selectOption({label:'Private GM Roll'});
  assert.equal(await page.locator('#chat-controls select').inputValue(),'Private GM Roll');
  await page.evaluate(()=>window.registered.chatSkin.onChange('cyberpunk'));
  const menuColors=await page.locator('#chat-controls select option').first().evaluate(el=>{
    const style=getComputedStyle(el);return {background:style.backgroundColor,text:style.color,scheme:getComputedStyle(el.parentElement).colorScheme};
  });
  assert.equal(menuColors.background,'rgb(16, 26, 32)');
  assert.equal(menuColors.text,'rgb(229, 239, 241)');
  assert.equal(menuColors.scheme,'dark');
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>window.registered.chatSkin.onChange(skin),skin);
    assert.equal(await page.locator('#chat-message').inputValue(),'Draft message /roll 1d10');
    for(const width of [260,300,400]) {
      await page.locator('#composer-check').evaluate((el,w)=>el.style.width=w+'px',width);
      assert.ok(await page.locator('#composer-check').evaluate(el=>el.scrollWidth<=el.clientWidth));
    }
  }
  await page.evaluate(()=>window.registered.chatSkin.onChange('cyberpunk'));
  await page.locator('#composer-check').evaluate(el=>el.style.width='300px');
  await page.locator('#chat-message').fill('');
  await page.locator('#chat-message').focus();
  await page.locator('#composer-check').screenshot({path:new URL('../docs/composer-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  console.log('Composer skin switching preserves drafts; narrow widths passed.');
  await page.evaluate(()=>{
    const card=window.fixture('release-portrait',false);
    card.querySelector('.message-content').innerHTML='<section class="pneuma-grapple-card"><div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><strong>Release: Pex → Rage</strong></div></div><div class="rollcard-bottom">Pex released Rage (no Action).</div></div></section>';
    window.hooks.renderChatMessage({...window.msg,flags:{'pneuma-combattools':{grappleParticipants:{target:{token:'Scene.s.Token.rage'}}}}},[card]);
  });
  assert.equal(await page.locator('#release-portrait .pneuma-exchange-defender-image').count(),1);
  assert.doesNotMatch(await page.locator('#release-portrait .pneuma-exchange-defender-image').getAttribute('src'),/mystery-man/);
  const actualDice=await Promise.all(['d10_skull','d10_5'].map(async name=>'data:image/webp;base64,'+(await readFile(new URL('../../PneumaChatDice/icons/dice/red-blue/'+name+'.webp',import.meta.url))).toString('base64')));
  await page.locator('#complete-exchange .d10-dice-div img').evaluateAll((images,sources)=>images.forEach((img,i)=>img.src=sources[i%2]),actualDice);
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>window.registered.chatSkin.onChange(skin),skin);
    for(const width of [260,300,400]) {
      await page.locator('#complete-exchange, #big-damage').evaluateAll((els,w)=>els.forEach(el=>el.style.width=w+'px'),width);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const dice=await page.locator('#complete-exchange .d10-dice-div img, #big-damage .d6-dice-div img').evaluateAll(images=>images.map(img=>{
        // Emulate native size classes supplying an incompatible fixed height.
        img.style.height='120px';const box=img.getBoundingClientRect();
        return {width:box.width,height:box.height,fit:getComputedStyle(img).objectFit};
      }));
      for(const die of dice){assert.ok(Math.abs(die.width-die.height)<1,'dice remain square under width constraints');assert.equal(die.fit,'contain');}
    }
  }
  console.log('Dice proportions preserved across skins and constrained widths, including conflicting native heights.');
  await page.evaluate(()=>window.registered.chatSkin.onChange('cyberpunk'));
  await page.locator('#complete-exchange').evaluate(el=>el.style.width='300px');
  await page.locator('#complete-exchange .pneuma-defense-result').screenshot({path:new URL('../docs/critical-dice-proportions.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.evaluate(()=>{
    const skill=window.fixture('skill-header');
    skill.querySelector('.rollcard-top .text-normal').textContent='Resist Torture/Drugs';
    skill.querySelector('.rollcard-subtitle-center').remove();
    skill.querySelector('.rollcard-top .cpr-block').insertAdjacentHTML('beforeend','<div class="text-small">Skill</div>');
    skill.querySelector('[data-action="rollDamage"]').remove();
    window.hooks.renderChatMessage(window.msg,[skill]);
  });
  await page.evaluate(()=>{
    for(const [id,html] of [['get-up','<p class="pneuma-self-action-report">Pex gets up using their Action.</p>'],['reload','<p class="pneuma-ammo-notice" data-ammo-action="reload">Pex reloads Heavy Pistol</p>'],['change-ammo','<p class="pneuma-ammo-notice" data-ammo-action="change">Pex changes ammo in Heavy Pistol</p>']]) {
      const card=window.fixture(id,false);card.querySelector('.message-content').innerHTML=html;window.hooks.renderChatMessage(window.msg,[card]);
    }
    const card=window.fixture('ma-recovery');
    card.querySelector('.rollcard-top .text-normal').textContent='MA Recovery — DV13';
    card.querySelector('[data-action="rollDamage"]').remove();
    card.querySelector('.message-content').insertAdjacentHTML('beforeend','<p class="pneuma-ma-recovery-result">MA Recovery succeeds: get up without spending an Action.</p>');
    window.hooks.renderChatMessage(window.msg,[card]);
  });
  for(const [id,action] of [['get-up','Get Up'],['reload','Reload'],['change-ammo','Change Ammo']]) {
    assert.equal(await page.locator('#'+id+' .pneuma-rail-action').innerText(),action);
    assert.equal(await page.locator('#'+id+' .pneuma-card-title h3').innerText(),'TAKING ACTION');
  }
  await page.evaluate(()=>{
    const card=window.fixture('adhoc-damage',false);
    card.querySelector('.message-content').innerHTML='<section class="rollcard pneuma-manual-card" data-manual-kind="damage"><h3>Custom blast</h3><div class="pneuma-damage-result"><div class="d6-rollcard-data"><div class="d6-number-div">12</div></div><button data-action="applyDamage">Apply</button></div></section>';
    window.hooks.renderChatMessage(window.msg,[card]);
  });
  assert.equal(await page.locator('#adhoc-damage .pneuma-rail-action').innerText(),'Damage');
  assert.equal(await page.locator('#adhoc-damage .pneuma-card-title h3').innerText(),'DAMAGE ROLL');
  assert.equal(await page.locator('#adhoc-damage [data-action="applyDamage"]').isVisible(),true);
  assert.ok(await page.locator('#adhoc-damage').evaluate(el=>{
    const body=el.querySelector('.message-content').getBoundingClientRect();const rail=el.querySelector('.pneuma-participant-rail').getBoundingClientRect();
    return body.top>=rail.bottom && body.width>el.getBoundingClientRect().width-24;
  }));
  assert.equal(await page.locator('#ma-recovery .pneuma-heading-skill').count(),1);
  await page.evaluate(()=>{
    for(const [id,title] of [['critical-injury-label','Critical Injuries (Body)'],['d6-table-label','Table result']]) {
      const card=window.fixture(id,false);
      card.querySelector('.message-content').innerHTML=`<section class="rollcard"><div class="rollcard-top"><div class="cpr-block"><div class="text-normal">${title}</div></div></div><div class="d6-rollcard-data"><div class="d6-number-div">7</div></div></section>`;
      window.hooks.renderChatMessage(window.msg,[card]);
    }
  });
  assert.equal(await page.locator('#critical-injury-label .pneuma-rail-action').innerText(),'Critical Injury');
  assert.equal(await page.locator('#critical-injury-label .pneuma-action-header h3').innerText(),'CRITICAL INJURY (BODY)');
  await page.evaluate(()=>{
    const card=window.fixture('critical-head',false);
    card.querySelector('.message-content').innerHTML='<section class="rollcard"><div class="rollcard-top"><div class="cpr-block"><div class="text-normal">Lost Eye</div><div class="text-small">Critical Injuries (Head)</div><a data-action="injury">Apply injury</a></div></div><div class="d6-rollcard-data"><div class="d6-number-div">7</div></div></section>';
    window.hooks.renderChatMessage(window.msg,[card]);
  });
  assert.equal(await page.locator('#critical-head .pneuma-action-header h3').innerText(),'CRITICAL INJURY (HEAD)');
  assert.doesNotMatch(await page.locator('#critical-head .pneuma-action-header').innerText(),/Lost Eye/);
  assert.match(await page.locator('#critical-head .pneuma-critical-result').innerText(),/Lost Eye/);
  assert.equal(await page.locator('#critical-head .pneuma-critical-result [data-action="injury"]').isVisible(),true);
  assert.ok(await page.locator('#critical-head').evaluate(el=>el.querySelector('.pneuma-critical-result').getBoundingClientRect().top>=el.querySelector('.d6-rollcard-data').getBoundingClientRect().bottom));
  assert.doesNotMatch(await page.locator('#d6-table-label .pneuma-participant-rail').innerText(),/Suppression/);
  assert.equal(await page.locator('#ma-recovery .pneuma-exchange-weapon').innerText(),'MARTIAL ARTS RECOVERY');
  assert.equal(await page.locator('#ma-recovery .pneuma-check-dv').innerText(),'DV13');
  assert.equal(await page.locator('#skill-header .pneuma-heading-skill').count(),1);
  await page.evaluate(()=>{
    for(const [id,title,kind] of [['stat-header','DEX','Stat'],['role-header','Interface','Role Ability'],['initiative-header','Initiative','Initiative'],['damage-header','Damage','Damage']]) {
      const card=window.fixture(id);
      card.querySelector('.rollcard-top .text-normal').textContent=title;
      card.querySelector('.rollcard-subtitle-center').textContent=kind;
      card.querySelector('[data-action="rollDamage"]').remove();
      window.hooks.renderChatMessage(window.msg,[card]);
    }
  });
  for(const [id,label] of [['stat-header','Stat'],['role-header','Role Ability'],['initiative-header','Initiative'],['damage-header','Suppression']]) {
    assert.equal(await page.locator('#'+id+' .pneuma-rail-action').innerText(),label);
  }
  assert.equal(await page.locator('#private-netrunner .pneuma-exchange-defender').innerText(),'Yam');
  assert.equal(await page.locator('#private-netrunner .pneuma-exchange-defender-image').count(),1);
  assert.equal(await page.locator('#skill-header .pneuma-rail-action').innerText(),'Skill');
  assert.match(await page.locator('#skill-header .pneuma-chat-action').innerText(),/Resist Torture\/Drugs/i);
  assert.equal(await page.locator('#private-netrunner .pneuma-heading-net .pneuma-card-title h3').innerText(),'JACK IN');
  assert.equal(await page.locator('#text .pneuma-card-heading .pneuma-chat-portrait').count(),1);
  for(const id of ['text','skill-header','private-netrunner','complete-exchange','release-portrait']) {
    const order=await page.locator('#'+id+' .pneuma-participant-rail').evaluate(el=>Array.from(el.children).map(child=>['pneuma-chat-portrait','pneuma-chat-identity','pneuma-rail-arrow','pneuma-rail-action','pneuma-exchange-defender','pneuma-exchange-defender-image'].find(cls=>child.classList.contains(cls))));
    const expected=id==='text'?['pneuma-chat-portrait','pneuma-chat-identity']:['pneuma-chat-portrait','pneuma-chat-identity','pneuma-rail-arrow','pneuma-rail-action'];
    if(['complete-exchange','release-portrait','private-netrunner'].includes(id)) expected.push('pneuma-rail-arrow','pneuma-exchange-defender','pneuma-exchange-defender-image');
    assert.deepEqual(order,expected,id+' rail order');
    assert.equal(await page.locator('#'+id+' .pneuma-action-header').count(),id==='text'?0:1);
    assert.equal(await page.locator('#'+id+' .pneuma-action-header :is(.pneuma-header-symbol,.pneuma-exchange-weapon-image)').count(),id==='text'?0:1);
  }
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>window.registered.chatSkin.onChange(skin),skin);
    for(const id of ['text','skill-header','private-netrunner','complete-exchange','grenade-true','release-portrait']) {
      for(const width of [260,300,400]) {
        await page.locator('#'+id).evaluate((el,w)=>el.style.width=w+'px',width);
        const geometry=await page.locator('#'+id).evaluate(el=>{
          const header=el.querySelector('.pneuma-card-heading > :not(.pneuma-participant-rail)')?.getBoundingClientRect();
          const body=el.querySelector('.pneuma-resolution-attack, .pneuma-attack-result, .message-content').getBoundingClientRect();
          const primary=el.querySelector('.pvt-opening-row');
          const content=(primary ?? el.querySelector('.message-content')).getBoundingClientRect();
          const rail=el.querySelector('.pneuma-participant-rail').getBoundingClientRect();
          return {below:!header || content.top>=header.bottom-1,right:content.left>=rail.right,overflow:el.scrollWidth>el.clientWidth};
        });
        assert.ok(geometry.below,id+' roll follows title');assert.ok(geometry.right,id+' opening content stays beside rail');assert.equal(geometry.overflow,false,id+' overflow');
      }
    }
  }
  await page.evaluate(()=>window.registered.chatSkin.onChange('cyberpunk'));
  for(const id of ['text','skill-header','private-netrunner','complete-exchange','ma-recovery','get-up','reload','adhoc-damage','critical-head']) {
    await page.locator('#'+id).evaluate(el=>el.style.width='300px');
    await page.locator('#'+id).screenshot({path:new URL('../docs/header-'+id+'.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  }
  console.log('Opening content beneath title and beside rail across card families and skins; later phases retain full-width checks.');
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(s=>registered.chatSkin.onChange(s),skin);
    for(const width of [260,300,400]) {
      await page.locator('#complete-exchange').evaluate((el,w)=>el.style.width=w+'px',width);
      await page.locator('#split-top').evaluate((el,w)=>el.style.width=w+'px',width);
      const edges=await page.locator('#split-top').evaluate(el=>{
        const card=el.getBoundingClientRect(),bar=el.querySelector('.pneuma-resolution-result').getBoundingClientRect();
        return [bar.left-card.left,card.right-bar.right];
      });
      assert.ok(edges.every(edge=>edge<=2),'result bar reaches card edges');
      for(const selector of ['#complete-exchange .d10-number-div','#technical-native-light .d10-number-div','#mini-results summary']) {
        const total=page.locator(selector).first();
        const sizes=[];
        for(const value of ['8','18']) {
          sizes.push(await total.evaluate((el,value)=>{el.textContent=value;const box=el.getBoundingClientRect();return [box.width,box.height];},value));
        }
        assert.deepEqual(sizes[0],sizes[1],'single/double digit wells are identical');
      }

    }
  }
  await page.evaluate(()=>{
    const total=document.createElement('div');total.className='d6-number-div';total.id='damage-total-fit';
    total.innerHTML='<span class="clickable">19</span>';
    document.querySelector('#adhoc-damage .message-content').append(total);
  });
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(s=>registered.chatSkin.onChange(s),skin);
    for(const value of ['9','19','99']) {
      const fits=await page.locator('#damage-total-fit').evaluate((el,value)=>{
        el.firstElementChild.textContent=value;
        const box=el.getBoundingClientRect(),text=el.firstElementChild.getBoundingClientRect();
        return getComputedStyle(el).fontSize==='32px' && text.width<=box.width-4 && text.height<=box.height-4 && el.scrollHeight<=el.clientHeight;
      },value);
      assert.ok(fits,`damage total fits fixed box: ${skin}/${value}`);
    }
  }
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(s=>registered.chatSkin.onChange(s),skin);
    for(const id of ['text','skill-header','private-netrunner']) {
      const card=page.locator('#'+id);
      for(const width of [260,300,400]) {
        await card.evaluate((el,w)=>el.style.width=w+'px',width);
        assert.ok(await card.evaluate(el=>{
          const rail=el.querySelector('.pneuma-participant-rail').getBoundingClientRect();
          return Math.abs(rail.bottom-(el.getBoundingClientRect().bottom-1))<1;
        }),`single-section rail reaches bottom ${skin}/${id}/${width}`);
      }
    }
  }
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(s=>registered.chatSkin.onChange(s),skin);
    for(const width of [260,300,400]) {
      await page.locator('#complete-exchange').evaluate((el,w)=>el.style.width=w+'px',width);
      const divider=await page.locator('#complete-exchange .pneuma-resolution-evade').evaluate(el=>{
        const style=getComputedStyle(el,'::after');return {height:style.height,width:parseFloat(style.width),image:style.backgroundImage};
      });
      assert.equal(divider.height,'1px');assert.ok(Math.abs(divider.width-(width-78))<1);
      assert.equal(divider.image==='none',skin==='technical');
    }
  }
  await page.evaluate(()=>registered.chatSkin.onChange('technical'));
  for(const mode of ['light','dark']) {
    const badge=page.locator('#technical-native-'+mode+' .pneuma-card-meta > .chat-mode-indicator');
    assert.equal(await badge.evaluate(el=>getComputedStyle(el).backgroundColor),mode==='light'?'rgb(234, 234, 234)':'rgb(59, 59, 59)');
    assert.equal(await badge.evaluate(el=>getComputedStyle(el).color),mode==='light'?'rgb(25, 25, 25)':'rgb(238, 238, 238)');
    assert.equal(await badge.evaluate(el=>getComputedStyle(el).borderTopColor),mode==='light'?'rgb(185, 2, 2)':'rgb(82, 96, 109)');
  }
  for(const mode of ['light','dark']) {
    const card=page.locator('#technical-native-'+mode);
    assert.equal(await card.locator('.pneuma-participant-rail').evaluate(el=>getComputedStyle(el).backgroundColor),mode==='light'?'color(srgb 0.844235 0.844235 0.844235)':'color(srgb 0.115451 0.126275 0.147922)');
  }
  await page.evaluate(()=>{
    registered.chatSkin.onChange('cyberpunk');
    const root=document.querySelector('#grapple-Grab');
    root.querySelector('.rollcard-bottom').insertAdjacentHTML('beforeend','<div class="pneuma-grapple-rolls"><div class="pneuma-roll-winner"><div class="d10-number-div"><span>18</span></div></div><div class="pneuma-roll-loser"><div class="d10-number-div"><span>9</span></div></div></div>');
  });
  for(const state of ['winner','loser']) {
    const read=el=>{
      const style=getComputedStyle(el),frame=getComputedStyle(el,'::before'),inner=getComputedStyle(el,'::after');
      return [style.width,style.height,style.color,frame.clipPath,frame.backgroundColor,inner.backgroundImage];
    };
    assert.deepEqual(await page.locator('#grapple-Grab .pneuma-roll-'+state+' .d10-number-div').evaluate(read),await page.locator('#complete-exchange .pneuma-roll-'+state+' .d10-number-div').evaluate(read),'grapple matches ranged opposed total');
  }
  await page.evaluate(()=>{
    const style=document.createElement('style');style.textContent='.pneuma-grapple-card .pneuma-grapple-rolls > div { margin-block:4px; }';document.head.prepend(style);
    registered.chatSkin.onChange('technical');
  });
  assert.deepEqual(await page.locator('#grapple-Grab .pneuma-grapple-rolls > div').evaluateAll(rows=>rows.map(el=>[getComputedStyle(el).marginTop,getComputedStyle(el).marginBottom])),[['0px','0px'],['0px','0px']]);
  await page.evaluate(()=>registered.chatSkin.onChange('technical'));
  for(const id of ['skill-header','private-netrunner','complete-exchange']) {
    const card=page.locator('#'+id);
    const colors=await card.evaluate(el=>{
      const accent=getComputedStyle(el).getPropertyValue('--pvt-accent').trim();
      const title=el.querySelector('.pneuma-action-header');
      const art=title.querySelector('.pneuma-exchange-weapon-image, .pneuma-header-symbol');
      return {accent,trim:getComputedStyle(title,'::after').backgroundImage,opacity:getComputedStyle(art).opacity};
    });
    assert.equal(colors.trim,'none','Minimal header has no Hub cyan gradient');
    assert.equal(colors.opacity,'0.42','consistent silhouette opacity');
  }
  // Palette switching must preserve every element's geometry, including dice and wrapped titles.
  for (const width of [260,300,400]) {
    for (const id of ['text','skill-header','private-netrunner','complete-exchange','grenade-true','adhoc-damage','critical-head']) {
      const card=page.locator('#'+id);
      await card.evaluate((el,w)=>el.style.width=w+'px',width);
      const measure=async skin=>{
        await page.evaluate(skin=>registered.chatSkin.onChange(skin),skin);
        return card.evaluate(el=>{
          const origin=el.getBoundingClientRect();
          return [el,...el.querySelectorAll('*')].map(node=>{
            const box=node.getBoundingClientRect();
            return (box.width===0 && box.height===0 ? [0,0,0,0] : [box.x-origin.x,box.y-origin.y,box.width,box.height]).map(n=>Math.round(n*100)/100);
          });
        });
      };
      assert.deepEqual(await measure('technical'),await measure('cyberpunk'),`shared geometry ${id}/${width}`);
    }
  }
  assert.deepEqual(await page.evaluate(()=>Object.keys(registered.chatSkin.choices)),['cyberpunk','technical']);
  await page.evaluate(()=>{
    registered.chatSkin.onChange('technical');
    const theme=document.querySelector('#theme-light');
    theme.style.setProperty('--cpr-background-chat-card','#182b25');
    theme.style.setProperty('--cpr-text-chat-normal','#d8efdc');
    theme.style.setProperty('--cpr-background-chat-card-block','#82c997');
    theme.style.setProperty('--cpr-background-chat-border','#82c997');
    theme.style.setProperty('--cpr-background-border','#82c997');
    theme.style.setProperty('--cpr-background-chat-card-block-before','#284b37');
  });
  assert.equal(await page.locator('#technical-native-light').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(24, 43, 37)');
  assert.equal(await page.locator('#technical-native-light .pneuma-exchange-weapon').evaluate(el=>getComputedStyle(el).color),'rgb(216, 239, 220)');
  assert.equal(await page.locator('#technical-native-light').evaluate(el=>getComputedStyle(el).borderLeftColor),'rgb(130, 201, 151)');
  console.log('Hub/Minimal identical geometry at 260/300/400px across card families passed.');
  // Source-level ownership: a theme may supply paint tokens, never layout
  // declarations or important overrides. Parse with the browser's CSS parser.
  for (const file of ['chat-hub.css', 'chat-theme.css']) {
    const source = await readFile(new URL('../src/'+file, import.meta.url), 'utf8');
    const violations = await page.evaluate(css => {
      const sheet = new CSSStyleSheet(); sheet.replaceSync(css);
      return [...sheet.cssRules].flatMap(rule => [...rule.style].filter(property =>
        !property.startsWith('--') || rule.style.getPropertyPriority(property) ||
        /--pvt-(rail-width|space|total-size|total-font|mini-size|opening-end|row)$/.test(property)));
    }, source);
    assert.deepEqual(violations, [], file+' only supplies appearance tokens');
  }
  await page.evaluate(() => {
    const demo=document.createElement('div');demo.id='structure-review';
    demo.style.cssText='display:flex;gap:16px;align-items:flex-start;padding:32px 8px;background:#303238';
    document.body.append(demo);
    const roll=()=>{
      const fragment=document.querySelector('#complete-exchange .pneuma-attack-result .rollcard').cloneNode(true);
      fragment.querySelector('.rollcard-top')?.remove();
      // Use one die to keep the nested-workflow fixture representative.
      fragment.querySelector('.d10-dice-div').replaceChildren(fragment.querySelector('img'));
      return fragment.outerHTML;
    };
    for(const family of ['grapple','quickhack']) {
      const card=window.fixture('structure-'+family,false);
      card.classList.add('pneuma-combat-message');
      const rows=['winner','loser'].map((state,i)=>`<div class="${family==='quickhack'?'pneuma-quickhack-roll ':''}pneuma-roll-${state}"><h4>${i?'Defense':'Attack'}</h4>${roll()}</div>`).join('');
      card.querySelector('.message-content').innerHTML=family==='grapple'
        ? `<section class="pneuma-grapple-card"><div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><strong>Grab: Pex → Rage</strong></div></div><div class="rollcard-bottom"><p class="pneuma-grapple-note" hidden>Grapple active</p><div class="pneuma-grapple-rolls">${rows}</div><div class="pneuma-grapple-controls"></div></div></div></section><section class="pneuma-grapple-explanation"><strong>Grapple active</strong><ul><li>-2 Actions</li><li>No two-handed weapons</li></ul></section>`
        : `<div class="rollcard pneuma-quickhack-card"><div class="rollcard-top"><div class="cpr-block pneuma-quickhack-heading"><h3>Force Out</h3><p class="pneuma-quickhack-participants">Pex → Rage</p></div></div>${rows}<section class="pneuma-resolution-section pneuma-resolution-result"><div class="cpr-block pneuma-quickhack-result">Connection ended</div></section></div>`;
      demo.append(card);
      card.style.cssText='--cpr-background-chat-card:#eaeaea;--cpr-text-chat-normal:#191919;--cpr-background-chat-card-block:#b90202;--cpr-background-chat-card-block-before:#eaeaea';
      window.hooks.renderChatMessage(window.msg,[card]);
    }
  });
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>registered.chatSkin.onChange(skin),skin);
    assert.equal(await page.locator('.pneuma-theme-cyberpunk.pneuma-theme-technical').count(),0,'skins are mutually exclusive');
    for(const width of [260,300,400]) {
      for(const family of ['grapple','quickhack']) {
        const card=page.locator('#structure-'+family);
        await card.evaluate((el,w)=>el.style.width=w+'px',width);
        const geometry=await card.evaluate(el=>{
          const rail=el.querySelector('.pneuma-participant-rail').getBoundingClientRect();
          const bounds=el.getBoundingClientRect();
          const rows=[...el.querySelectorAll('.pneuma-roll-winner, .pneuma-roll-loser')].map(row=>row.getBoundingClientRect());
          const divider=getComputedStyle(el.querySelector('.pvt-opposed-divider'),'::after');
          return {flush:rows.every(row=>Math.abs(row.left-rail.right)<1 && Math.abs(row.right-(bounds.right-1))<1),gap:rows[1].top-rows[0].bottom,divider:parseFloat(divider.width),width:rows[1].width,overflow:el.scrollWidth>el.clientWidth};
        });
        assert.ok(geometry.flush,family+' outcome paint reaches both right-frame edges');
        assert.equal(geometry.gap,0,family+' no blank strip between rolls');
        assert.ok(Math.abs(geometry.divider-geometry.width)<1,family+' divider uses right frame');
        assert.equal(geometry.overflow,false);
      }
      assert.ok(await page.locator('#structure-grapple').evaluate(el=>{
        const rail=el.querySelector('.pneuma-participant-rail').getBoundingClientRect();
        const section=el.querySelector('.pneuma-grapple-explanation').getBoundingClientRect();
        return Math.abs(rail.bottom-section.top)<1 && Math.abs(section.width-(el.clientWidth))<1;
      }),'native grapple explanation is full width below the entire rail');
    }
  }
  // Removing a later section must also restore a full-height opening rail.
  await page.locator('#structure-grapple .pneuma-grapple-explanation').evaluate(el=>el.remove());
  await page.waitForFunction(()=>{
    const card=document.querySelector('#structure-grapple');
    return Math.abs(card.querySelector('.pneuma-participant-rail').getBoundingClientRect().bottom-(card.getBoundingClientRect().bottom-1))<1;
  });
  for(const skin of ['cyberpunk','technical']) {
    await page.evaluate(skin=>registered.chatSkin.onChange(skin),skin);
    await page.locator('#structure-review .chat-message').evaluateAll(cards=>cards.forEach(card=>card.style.width='300px'));
    await page.locator('#structure-review').screenshot({path:new URL('../docs/structure-'+skin+'.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  }
  console.log('Theme ownership, exclusive classes, nested opposed rows and native grapple section boundaries passed.');
  // Load the actual Green Theme after VisualTools: its direct chat overrides
  // must leave Hub unchanged while Minimal continues to inherit its palette.
  await page.evaluate(()=>{
    const log=document.createElement('div');log.id='chat-log';document.body.append(log);
    log.append(document.querySelector('#complete-exchange'));
  });
  const palette=()=>page.locator('#complete-exchange').evaluate(card=>
    [card,card.querySelector('.message-sender, .pneuma-exchange-attacker'),card.querySelector('.rollcard'),card.querySelector('.d10-number-div')]
      .map(el=>{const s=getComputedStyle(el);return [s.backgroundColor,s.color,s.borderTopColor,s.borderTopWidth,s.padding,s.borderRadius];}));
  await page.evaluate(()=>registered.chatSkin.onChange('cyberpunk'));
  const hubBefore=await palette();
  await page.evaluate(()=>registered.chatSkin.onChange('technical'));
  const minimalBefore=await palette();
  await page.evaluate(()=>registered.chatSkin.onChange('cyberpunk'));
  const greenStyle=await page.addStyleTag({content:await readFile(new URL('../../PneumaGreenTheme/styles/pneuma-green-theme.css',import.meta.url),'utf8')});
  assert.deepEqual(await palette(),hubBefore,'actual Green Theme must not repaint Hub');
  await page.evaluate(()=>registered.chatSkin.onChange('technical'));
  assert.notDeepEqual(await palette(),minimalBefore,'Minimal should follow Green Theme');
  await greenStyle.evaluate(el=>el.remove());
  console.log('Actual Green Theme preserves Hub and recolors Minimal.');
} finally { await browser.close(); }
