
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.setContent('<style>*{box-sizing:border-box}.chat-message{margin:20px}.hide{display:none}[class$="-rollcard-data"]{display:grid;grid-template-areas:"native-dice native-total" "native-details native-details"}</style>');
 for(const file of ['chat-cards.css','chat-theme.css']) await page.addStyleTag({content:await readFile(new URL('../src/'+file,import.meta.url),'utf8')});
 for(const width of [260,300,400]) for(const type of ['d10','d6','generic']) for(const count of [1,2]) for(const context of ['pneuma-treatment-card','pneuma-stabilize-card','pneuma-role-card','pneuma-skill-card','pneuma-quickhack-roll','pneuma-grapple-rolls','pneuma-resolution-attack','pneuma-resolution-evade','ordinary']) {
  await page.evaluate(({width,type,count,context})=>{
   const root=document.createElement('article');root.className='chat-message pneuma-chat-card pneuma-theme-technical pneuma-skin-compact';root.style.width=width+'px';
   const src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" fill="purple"/></svg>');
   root.innerHTML='<div class="message-content pvt-opening-row '+context+'"><div class="'+type+'-rollcard-data"><div class="'+type+'-dice-div">'+Array.from({length:count},()=>'<img src="'+src+'">').join('')+'</div><div class="'+type+'-number-div">17</div><div class="'+type+'-data-div hide">Saved breakdown</div></div></div>';
   document.body.replaceChildren(root);
  },{width,type,count,context});
  const geometry=await page.evaluate(({type})=>{
   const total=document.querySelector('.'+type+'-number-div').getBoundingClientRect();
   const dice=[...document.querySelectorAll('img')].map(img=>img.getBoundingClientRect());
   const root=document.querySelector('article');
   return {left:dice.every(d=>d.right<=total.left+1),visible:dice.every(d=>d.width>0&&d.height>0),fits:root.scrollWidth<=root.clientWidth};
  },{type});
  assert.deepEqual(geometry,{left:true,visible:true,fits:true},context+' '+type+' '+count+' '+width);
 }
 console.log('Ultra Compact single/critical D10, D6 and generic dice remain left of totals across medical, skill, role, grapple, QuickHack, attack/defense and ordinary wrappers at 260/300/400px.');
} finally {await browser.close();}
