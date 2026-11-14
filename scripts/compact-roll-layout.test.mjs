
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.setContent('<style>.rollcard-critinjury-data{grid-area:d6-data;display:flex}*{box-sizing:border-box}.chat-message{margin:20px}.hide{display:none}[class$="-rollcard-data"]{display:grid;grid-template-areas:"native-dice native-total" "native-details native-details"}</style>');
 for(const file of ['chat-cards.css','chat-theme.css']) await page.addStyleTag({content:await readFile(new URL('../src/'+file,import.meta.url),'utf8')});
 for(const width of [260,300,400]) for(const type of ['d10','d6','generic']) for(const count of [1,2]) for(const context of ['pneuma-treatment-card','pneuma-stabilize-card','pneuma-role-card','pneuma-skill-card','pneuma-quickhack-roll','pneuma-grapple-rolls','pneuma-resolution-attack','pneuma-resolution-evade','ordinary','critical-injury']) {
  await page.evaluate(({width,type,count,context})=>{
   const root=document.createElement('article');root.className='chat-message pneuma-chat-card pneuma-theme-technical pneuma-skin-compact';root.style.width=width+'px';
   const src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" fill="purple"/></svg>');
   const injury=context==='critical-injury'&&type==='d6'?'<div class="rollcard-critinjury-data"><img style="width:52px;height:52px" src="'+src+'"><a>Crushed Fingers</a></div>':'';
   root.innerHTML='<div class="message-content pvt-opening-row '+context+'"><div class="'+type+'-rollcard-data"><div class="'+type+'-dice-div">'+Array.from({length:count},()=>'<img src="'+src+'">').join('')+'</div><div class="'+type+'-number-div">17</div><div class="'+type+'-data-div hide">Saved breakdown</div>'+injury+'</div></div>';
   document.body.replaceChildren(root);
  },{width,type,count,context});
  const geometry=await page.evaluate(({type})=>{
   const total=document.querySelector('.'+type+'-number-div').getBoundingClientRect();
   const dice=[...document.querySelectorAll('.'+type+'-dice-div img')].map(img=>img.getBoundingClientRect());
   const root=document.querySelector('article');
   if(document.querySelector('.rollcard-critinjury-data')){const row=document.querySelector('.'+type+'-rollcard-data').getBoundingClientRect();if(Math.abs(total.right-row.right)>1)throw Error('Critical result is not at right edge');}
   return {left:dice.every(d=>d.right<=total.left+1),visible:dice.every(d=>d.width>0&&d.height>0),fits:root.scrollWidth<=root.clientWidth};
  },{type});
  assert.deepEqual(geometry,{left:true,visible:true,fits:true},context+' '+type+' '+count+' '+width);
 }
 for (const width of [260,300,400]) {
  await page.evaluate(width=>{
   const root=document.createElement('article');
   root.className='chat-message pneuma-chat-card pneuma-skin-compact';
   root.style.width=width+'px';
   root.innerHTML='<section class="pneuma-resolution-damage-roll"><div class="d6-rollcard-data"><div class="d6-dice-div" style="width:164px;height:80px">6 3 3 4<br>6 2 3 1</div><div class="d6-number-div">28</div><div class="d6-data-div">Critical Damage: 5</div></div><span class="pneuma-damage-ammo">Armor-Piercing</span></section>';
   document.body.replaceChildren(root);
  },width);
  const geometry=await page.evaluate(()=>{
   const ammo=document.querySelector('.pneuma-damage-ammo').getBoundingClientRect();
   const dice=document.querySelector('.d6-dice-div').getBoundingClientRect();
   const total=document.querySelector('.d6-number-div').getBoundingClientRect();
   const root=document.querySelector('article');
   return {horizontal:ammo.width>ammo.height,belowDice:ammo.top>=dice.bottom-1,separate:dice.right<=total.left+1,fits:root.scrollWidth<=root.clientWidth};
  });
  assert.deepEqual(geometry,{horizontal:true,belowDice:true,separate:true,fits:true},'Rocket ammunition at '+width);
 }
 const combatCSS=await readFile(new URL('../../PneumaCombatTools/src/styles/pneuma-combattools.css',import.meta.url),'utf8');
 await page.addStyleTag({content:combatCSS});
 for(const width of [260,300,400]) for(const pending of [false,true]) for(const labelFirst of [false,true]){
  await page.evaluate(({width,pending,labelFirst})=>{
   const root=document.createElement('article');
   root.className='chat-message pneuma-combat-message pneuma-chat-card pneuma-skin-compact';
   root.style.width=width+'px';
   const content=pending?'<details open><summary>11 - Broken Ribs - application pending</summary><div class="pneuma-critical-details">Critical injury description</div></details>':'<strong>Critical Injury - Selected Token</strong>';
   const recipient=name=>{
    const label='<span class="pneuma-damage-recipient-label">'+name+'</span>',action='<a class="pneuma-apply-damage">⚡</a>';
    return '<div class="pneuma-damage-recipient">'+(labelFirst?label+action:action+label)+'</div>';
   };
   root.innerHTML='<div class="message-content pvt-section-flow"><section class="pneuma-resolution-damage-apply pneuma-damage-application pvt-section-rail"><div class="pneuma-damage-application-box"><div class="pneuma-damage-controls">'+recipient('Rage')+recipient('Selected Token')+'<div class="pneuma-critical-row"><strong>Critical Injury - Rage</strong><button class="pneuma-apply-critical">♥</button></div><div class="pneuma-critical-row">'+content+'<button class="pneuma-apply-critical">'+(pending?'Finish injury application':'♥')+'</button></div></div></div></section></div>';
   document.body.replaceChildren(root);
  },{width,pending,labelFirst});
  const geometry=await page.evaluate(()=>{
   const rows=[...document.querySelector('.pneuma-damage-controls').children].map(n=>n.getBoundingClientRect());
   const labels=[...document.querySelectorAll('.pneuma-damage-recipient-label')].map(n=>n.getBoundingClientRect());
   const button=document.querySelector('.pneuma-critical-row:last-child button').getBoundingClientRect();
   const root=document.querySelector('article');
   const aligned=[...document.querySelectorAll('.pneuma-damage-recipient')].every(row=>{
    const label=row.querySelector('.pneuma-damage-recipient-label').getBoundingClientRect(),action=row.querySelector('.pneuma-apply-damage').getBoundingClientRect();
    return label.right<=action.left && label.top<action.bottom && action.top<label.bottom;
   });
   return {stacked:rows.every((r,i)=>!i||r.top>=rows[i-1].bottom-1),readable:labels.every(r=>r.height<50),buttonReadable:button.height<70,fits:root.scrollWidth<=root.clientWidth,aligned};
  });
  assert.deepEqual(geometry,{stacked:true,readable:true,buttonReadable:true,fits:true,aligned:true},'Damage application '+width+' pending='+pending+' labelFirst='+labelFirst);
 }
 console.log('Compact dice and ammunition layout passed at 260/300/400px.');
} finally {await browser.close();}
