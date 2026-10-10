import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:850,height:1200}});
 await page.setContent('<style>*{box-sizing:border-box}body{font:14px Arial}.chat-message{width:300px;background:#eee;border:1px solid #555;margin:24px}.hide{display:none}.d10-dice-div{height:80px}.d10-rollcard-data{display:grid;grid-template-areas:"dice total" "details details"}.d10-dice-div{grid-area:dice}.d10-number-div{grid-area:total}</style>');
 for(const file of ['chat-cards.css','chat-hub.css','chat-theme.css'])await page.addStyleTag({content:await readFile(new URL('../dist/'+file,import.meta.url),'utf8')});
 await page.evaluate(()=>{
  window.CONST={CHAT_MESSAGE_STYLES:{OTHER:0,OOC:1,IC:2,EMOTE:3},KEYBINDING_PRECEDENCE:{PRIORITY:0}};
  window.values={chatCards:true,chatSkin:'cyberpunk',chatPortraitSource:'actor',chatFallbackImage:'',chatDiceEnabled:false};
  window.Hooks={on:()=>{}};window.registered={};
  window.game={settings:{get:(_m,k)=>values[k],register:(_m,k,c)=>registered[k]=c},keybindings:{register:()=>{}},i18n:{localize:k=>k},user:{isGM:true},actors:new Map(),scenes:new Map()};
  window.img='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76"><rect width="76" height="76" fill="#a85"/></svg>');
  window.actor={img,prototypeToken:{texture:{src:img}},testUserPermission:()=>true,documentName:'Actor'};
  game.actors.set('pex',actor);window.fromUuidSync=uuid=>uuid==='Actor.rage'?actor:null;
  window.damageClicks=0;
 });
 const source=(await Promise.all(['chat-portrait-controls','weapon-silhouettes','chat-dice','exchange-header','chat-presentation','chat-cards'].map(name=>readFile(new URL('../dist/'+name+'.js',import.meta.url),'utf8')))).map(text=>text.replace(/^import .*;\r?\n/gm,'').replace(/export /g,'')).join('\n');
 await page.addScriptTag({content:source});
 await page.evaluate(()=>{
  registerChatCards();
  const roll='<div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><h3 class="text-normal">Heavy Pistol</h3><div class="rollcard-subtitle-center">Attack</div><button data-action="rollDamage">Damage</button></div></div><div class="d10-rollcard-data"><div class="d10-dice-div"><img src="' + img + '" alt="4"></div><div class="d10-number-div">25</div></div></div>';
  const create=(id,content,flags={},name='Pex')=>{
   const root=document.createElement('article');root.id=id;root.className='chat-message';
   root.innerHTML='<header class="message-header"><h4 class="message-sender">'+name+'</h4><span class="message-metadata">Now</span></header><div class="message-content">'+content+'</div>';
   root.addEventListener('click',event=>{if(event.target.closest('[data-action="rollDamage"]'))damageClicks++;});
   document.body.append(root);
   const message={visible:true,isContentVisible:true,blind:false,isRoll:false,style:0,speaker:{actor:'pex'},whisper:[],author:{id:'gm'},flags:{'pneuma-combattools':flags}};
   renderChatCard(message,root);arrangeChatCard(root,message);decorateRailDefender(message,root,{preference:'actor',fallback:'',choose:choosePortrait});installRollPopovers(root);
   return root;
  };
  for(const evasion of [false,true])create('attack-'+evasion,'<section class="pneuma-resolution-card"><section class="pneuma-resolution-attack">'+(evasion?roll.replace('<h3 class="text-normal">Heavy Pistol</h3>','').replace('<div class="rollcard-subtitle-center">Attack</div>','').replace('<button data-action="rollDamage">Damage</button>',''):roll)+'</section>'+(evasion?'<section class="pneuma-resolution-evade"><div class="rollcard"><div class="rollcard-top"><div class="cpr-block"><h3 class="text-normal">Evasion</h3></div></div><div class="rollcard-bottom"><div class="d10-rollcard-data"><div class="d10-dice-div">D10: 5</div><div class="d10-number-div">19</div></div></div></div></section>':'')+'</section>',{exchange:{attackerName:'Pex',defenderName:'Rage',title:'Heavy Pistol',defenderActor:'Actor.rage'}});
  create('grenade','<section class="rollcard pneuma-aoe-card"><div class="rollcard-top"><h3 class="pneuma-attack-name">Incendiary Grenade</h3></div><section class="pneuma-resolution-attack">'+roll+'</section></section>',{aoe:{exchange:{thrownSource:{}}}});
  for(const action of ['Grab','Break Grapple','Release','Choke','Throw'])create('grapple-'+action.replaceAll(' ','-'),'<section class="pneuma-grapple-card"><div class="rollcard"><div class="rollcard-top"><strong>'+action+': Pex → Rage</strong></div><div class="rollcard-bottom"><p>Published outcome</p><button>Resolve</button></div></div></section>');
  create('long-name',roll,{},'Very Long Character Name');
  create('solid-name',roll,{},'VeryLongCharacterName');
  create('plain','Ordinary chat.');
  create('skill',roll.replace('Heavy Pistol','Resist Torture/Drugs').replace('>Attack<','>Skill<').replace('<button data-action="rollDamage">Damage</button>',''));
  create('quickhack','<section class="pneuma-quickhack-card"><div class="pneuma-quickhack-heading"><h3>Jack In</h3><div class="pneuma-quickhack-participants">Unknown Netrunner → Rage</div></div><div class="pneuma-quickhack-roll">Published result</div></section>');
  create('opposed-grapple','<section class="pneuma-grapple-card"><div class="rollcard"><div class="rollcard-top"><strong>Grab: Pex → Rage</strong></div><div class="rollcard-bottom"><div class="pneuma-grapple-rolls"><div>'+roll+'</div><div>'+roll+'</div></div></div></div></section>');
  create('opposed-hack','<section class="pneuma-quickhack-card"><div class="pneuma-quickhack-heading"><h3>Force Out</h3></div><div class="pneuma-quickhack-roll">'+roll+'</div><div class="pneuma-quickhack-roll">'+roll+'</div><div class="pneuma-quickhack-result">Saved outcome</div></section>');
  create('reload','<p class="pneuma-ammo-notice" data-ammo-action="reload">Pex reloads Heavy Pistol</p>');
 });
 for(const skin of ['cyberpunk','technical','compact','compact-hub'])for(const width of [260,300,400]){
  await page.evaluate(({skin,width})=>{
   for(const root of document.querySelectorAll('.chat-message')){root.classList.remove('pneuma-theme-cyberpunk','pneuma-theme-technical');root.classList.toggle('pneuma-skin-compact',skin.startsWith('compact'));root.classList.add('pneuma-theme-'+(skin==='compact-hub'?'cyberpunk':skin==='compact'?'technical':skin));root.style.width=width+'px';}
  },{skin,width});
  for(const [id,selector] of [['attack-true','.pneuma-resolution-attack, .pneuma-resolution-evade'],['opposed-grapple','.pneuma-grapple-rolls > div'],['opposed-hack','.pneuma-quickhack-roll']]) {
   const geometry=await page.locator('#'+id).evaluate((root,selector)=>{
    const [a,b]=[...root.querySelectorAll(selector)].map(node=>node.getBoundingClientRect());
    return {side:Math.abs(a.top-b.top)<1 && a.right<=b.left+1 && Math.abs(a.width-b.width)<2,stacked:a.bottom<=b.top+1,fits:root.scrollWidth<=root.clientWidth};
   },selector);
   assert.equal(geometry.fits,true,id+' fits '+skin+' '+width);
   assert.equal(skin.startsWith('compact')?geometry.side:geometry.stacked,true,id+' opposed placement '+skin+' '+width);
  }
  for(const id of ['attack-false','attack-true','grenade','grapple-Grab','grapple-Break-Grapple','grapple-Release','grapple-Choke','grapple-Throw','long-name','solid-name','skill','quickhack','reload']){
   const card=page.locator('#'+id);
   assert.equal(await card.locator('.pneuma-rail-arrow').count(),1,id+' has one arrow');
   assert.equal(await card.locator('.pneuma-rail-arrow').innerText(),'↓');
   if(skin.startsWith('compact') && id==='attack-true') {
    for(const count of [1,2]) {
     await card.locator('.pneuma-resolution-attack .d10-dice-div').evaluate((group,count)=>{const die=group.querySelector('img');group.replaceChildren(die);if(count===2)group.append(die.cloneNode(true));},count);
     const bounds=await card.locator('.pneuma-resolution-attack').evaluate(section=>{
      const group=section.querySelector('.d10-dice-div').getBoundingClientRect();
      const total=section.querySelector('.d10-number-div').getBoundingClientRect();
      const dice=[...section.querySelectorAll('.d10-dice-div img')].map(img=>img.getBoundingClientRect());
      return {visible:dice.every(r=>r.width===36&&r.height===36&&r.left>=group.left&&r.right<=group.right+1),left:dice.every(r=>r.right<=total.left+1),diagonal:dice.length===1||(dice[1].left-dice[0].left===12&&dice[1].top-dice[0].top===12),aligned:Math.abs(group.top+group.height/2-(total.top+total.height/2))<1};
     });
     assert.deepEqual(bounds,{visible:true,left:true,diagonal:true,aligned:true},'compact '+count+' dice '+width);
    }
   }
   if(skin.startsWith('compact') && id==='attack-true') {
    const rows=await card.locator('.d10-dice-div').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().top));
    assert.equal(rows[0],rows[1],'Evasion label does not offset dice '+width);
   }
   if(skin.startsWith('compact') && id==='attack-false') {
    const separator=await card.locator('.pneuma-action-header').evaluate(header=>({decoration:getComputedStyle(header,'::before').content,height:getComputedStyle(header,'::after').height,clip:getComputedStyle(header,'::after').clipPath,matchesBorder:getComputedStyle(header,'::after').backgroundColor===getComputedStyle(header.closest('.chat-message')).borderTopColor}));
    assert.deepEqual(separator,{decoration:'none',height:'1px',clip:'none',matchesBorder:true});
   }
   if(skin.startsWith('compact') && id==='attack-false') assert.equal(await card.locator('.d10-dice-div img').evaluate(img=>img.getBoundingClientRect().width),36);
   const layout=await card.evaluate(root=>{
    const nodes=[root.querySelector('.pneuma-chat-identity .message-sender, .pneuma-chat-identity .pneuma-exchange-attacker'),root.querySelector('.pneuma-rail-arrow'),root.querySelector('.pneuma-rail-action')];
    const rects=nodes.map(n=>n.getBoundingClientRect());
    const rail=root.querySelector('.pneuma-participant-rail').getBoundingClientRect();
    const portrait=root.querySelector('.pneuma-chat-portrait').getBoundingClientRect();
    const target=root.querySelector('.pneuma-exchange-defender')?.getBoundingClientRect();
    const targetImage=root.querySelector('.pneuma-exchange-defender-image')?.getBoundingClientRect();
    return {stacked:rects[0].bottom<=rects[1].top+1&&rects[1].bottom<=rects[2].top+1,below:!target||target.top>=rects[2].bottom-1,noSecondArrow:!target||nodes[2].nextElementSibling===root.querySelector('.pneuma-exchange-defender'),portrait:Math.abs(portrait.width-portrait.height)<1&&Math.abs(portrait.width-(root.classList.contains("pneuma-skin-compact")?36:rail.width))<2,targetSize:!targetImage||(root.classList.contains("pneuma-skin-compact")?targetImage.width===0&&targetImage.height===0:targetImage.width===48&&targetImage.height===48),fits:root.scrollWidth<=root.clientWidth&&rects.every(r=>r.left>=rail.left&&r.right<=rail.right),minFont:parseFloat(getComputedStyle(nodes[0]).fontSize)>=11};
   });
   assert.deepEqual(layout,{stacked:true,below:true,noSecondArrow:true,portrait:true,targetSize:true,fits:true,minFont:true},id+' '+skin+' '+width);
  }
 }
 await page.evaluate(()=>{
  const root=document.querySelector('#attack-false');
  const section=document.createElement('section');section.className='pneuma-resolution-damage-roll pvt-full-section pvt-section-rail pvt-damage-collapsed';
  section.innerHTML='<div class="pneuma-resolution-label">Damage</div><div class="pneuma-resolution-body"><div class="pneuma-damage-heading"><span class="pneuma-damage-ammo">Incendiary</span></div><div class="d6-rollcard-data"><div class="d6-dice-div"><img src="'+img+'"></div><div class="d6-number-div">19</div></div></div>';
  root.append(section);window.savedAmmo=section.querySelector('.pneuma-damage-ammo');
  applyChatSkin(root,'compact');
 });
 for(const width of [260,300,400]) for(const count of [1,2,3,4,5,6,8]) {
  const rows=await page.evaluate(({width,count})=>{
   const root=document.querySelector('#attack-false');root.style.width=width+'px';
   const group=root.querySelector('.d6-dice-div');const original=group.querySelector('img');
   group.replaceChildren(...Array.from({length:count},()=>original.cloneNode(true)));
   group.classList.add('pneuma-balanced-dice');balanceDamageDice(group);
   const rects=[...group.children].map(img=>img.getBoundingClientRect());
   const bounds=group.getBoundingClientRect();
   if(width>=300 && rects.some(rect=>Math.abs(rect.width-32)>0.1))throw Error(JSON.stringify({width,count,parent:group.parentElement.clientWidth,group:group.clientWidth,faces:rects.map(r=>r.width),size:getComputedStyle(group).getPropertyValue("--pvt-damage-size")}));
   for(let i=0;i<rects.length;i++){
    if(rects[i].right>bounds.right+1)throw Error('Damage die escapes group');
    for(let j=i+1;j<rects.length;j++)if(Math.abs(rects[i].top-rects[j].top)<1&&rects[i].right>rects[j].left-1)throw Error('Damage dice overlap');
   }
   return new Set(rects.map(rect=>rect.top)).size;
  },{width,count});
  assert.equal(rows,count<=6?1:2,'damage dice rows '+count+' at '+width);
 }
 const critical=await page.evaluate(()=>{
  const section=document.querySelector('#attack-false .pneuma-resolution-damage-roll');
  const group=section.querySelector('.d6-dice-div');const die=group.querySelector('img');
  section.classList.remove('pneuma-resolution-damage-roll');section.classList.add('pneuma-critical-injury-card');
  group.replaceChildren(die,die.cloneNode(true));balanceDamageDice(group);
  const sizes=[...group.children].map(img=>img.getBoundingClientRect().width);
  section.classList.remove('pneuma-critical-injury-card');section.classList.add('pneuma-resolution-damage-roll');
  return sizes;
 });
 assert.deepEqual(critical,[32,32],'Compact critical injury retains readable D6 faces');
 assert.equal(await page.locator('#attack-false .pvt-damage-toggle').count(),0);
 assert.equal(await page.locator('#attack-false .pvt-damage-collapsed').count(),0);
 assert.equal(await page.locator('#attack-false .d6-rollcard-data > .pneuma-damage-ammo').count(),1);
 await page.evaluate(()=>applyChatSkin(document.querySelector('#attack-false'),'technical'));
 assert.equal(await page.locator('#attack-false .pvt-damage-toggle').count(),1);
 assert.equal(await page.locator('#attack-false .pvt-damage-footer > .pneuma-damage-ammo').count(),1);
 assert.equal(await page.evaluate(()=>savedAmmo===document.querySelector('#attack-false .pneuma-damage-ammo')),true);
 await page.evaluate(()=>applyChatSkin(document.querySelector('#attack-false'),'compact'));
 assert.equal(await page.locator('#plain .pneuma-rail-arrow').count(),0);
 assert.equal(await page.locator('#grenade .pneuma-rail-action').innerText(),'Throw');
 assert.equal(await page.locator('#grenade .pneuma-exchange-defender').innerText(),'Grenade');
 assert.equal(await page.locator('#quickhack .message-sender').innerText(),'Unknown Netrunner','concealed attacker name is retained');
 await page.locator('#attack-false [data-action="rollDamage"]').click();
 assert.equal(await page.evaluate(()=>damageClicks),1,'native damage control remains delegated');
 await page.evaluate(()=>{const root=document.querySelector('#attack-false');arrangeChatCard(root);installRollPopovers(root);});
 assert.equal(await page.locator('#attack-false .pneuma-rail-arrow').count(),1);
 await page.locator('#attack-true').screenshot({path:new URL('../docs/ultra-compact-opposed-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
 await page.locator('#attack-false').screenshot({path:new URL('../docs/ultra-compact-action-rail-check.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
 console.log('Stacked actor / down arrow / action / target rails, no second arrow, retained portrait sizes, evasion/no-evasion, grapple family, grenade, skill, long names, native controls and idempotence passed in all three skins at 260/300/400px.');
}finally{await browser.close();}
