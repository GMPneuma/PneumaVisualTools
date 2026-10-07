import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE || 'playwright');
// Load licensed server source locally; never vendor Foundry runtime into the repo.
const native=await readFile(process.env.PNEUMA_FOUNDRY_SOURCE || join(tmpdir(),'pneuma-foundry-v12-keybinding-source.js'),'utf8');
const nativeClass=name=>{
  const start=native.indexOf(`class ${name} {`);
  assert.ok(start>=0,`Missing native ${name}`);
  return native.slice(start,native.indexOf('\n}',start)+2);
};
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage();
  await page.setContent('<section id="chat"><main id="log"></main><textarea id="chat-message">Draft kept</textarea></section><section id="chat-popout"><main id="popout-log"></main><textarea>Popout draft</textarea></section>');
  await page.evaluate(()=>{
    window.CONST={KEYBINDING_PRECEDENCE:{PRIORITY:0,NORMAL:1},CHAT_MESSAGE_STYLES:{OTHER:0,OOC:1,IC:2,EMOTE:3}};
    window.CONFIG={debug:{keybindings:false}};
    window.values={chatSkin:'off',chatCards:true,chatDiceEnabled:true,chatDiceSet:'pneuma',chatDiceSets:[]};
    window.registered={};window.bindings={};window.callbacks={};window.renders=0;window.selects=0;window.cardReads=[];window.actions=0;
    window.Hooks={on:(name,fn)=>(callbacks[name]??=[]).push(fn)};
    window.game={messages:new Map(),settings:{get:(_m,k)=>values[k]??registered[k]?.default,register:(_m,k,v)=>registered[k]=v,set:async(_m,k,v)=>{values[k]=v;registered[k].onChange?.(v);}},keybindings:{activeKeys:new Map(),register:(m,k,v)=>{
      bindings[k]=v;
      for(const binding of v.editable??[]){
        const matches=game.keybindings.activeKeys.get(binding.key)??[];
        matches.push({...v,action:m+'.'+k,requiredModifiers:binding.modifiers??[],optionalModifiers:v.reservedModifiers??[],precedence:v.precedence??1,order:Object.keys(bindings).length});
        matches.sort((a,b)=>a.precedence-b.precedence||a.order-b.order);
        game.keybindings.activeKeys.set(binding.key,matches);
      }
    }},i18n:{localize:k=>k},user:{isGM:true},actors:new Map(),scenes:new Map()};
    // Deliberately overlapping normal-priority control registered before Visual Tools.
    game.keybindings.register('fixture','selectAll',{editable:[{key:'KeyC',modifiers:['Alt','Shift']}],onDown:()=>{selects++;return true;},onUp:()=>{selects++;return true;}});
    window.ChatLog=class {rendered=true;render(){if(this.rendered)return;renders++;}};
    window.ui={notifications:{error:message=>{throw Error(message);}},windows:{popout:new ChatLog()},chat:new ChatLog()};
    window.decorateExchangeHeader=()=>{};window.decorateRailDefender=()=>{};
    window.arrangeChatCard=root=>root.classList.add('pneuma-layout-participants');
    window.installRollPopovers=()=>{};window.arrangeDamageSections=()=>{};
    for(const id of ['a','b','c','unmounted']){
      const message={id,visible:true,isContentVisible:true,blind:false,speaker:{},whisper:[],author:{id:'test'},getHTML:async()=>{
        await new Promise(resolve=>setTimeout(resolve,2));
        cardReads.push(id);
        const root=document.createElement('article');root.className='chat-message';root.dataset.messageId=id;
        root.innerHTML='<header class="message-header"><h4 class="message-sender">Tester</h4></header><div class="message-content"><img src="systems/cyberpunk-red-core/icons/dice/black/d6_3.svg"><button>Native action</button></div>';
        root.querySelector('button').addEventListener('click',()=>actions++);
        for(const callback of callbacks.renderChatMessage??[])callback(message,[root]);
        return [root];
      }};
      game.messages.set(id,message);
    }
  });
  await page.addScriptTag({content:nativeClass('ClientKeybindings')+'\n'+nativeClass('KeyboardManager')+'\ngame.keyboard=new KeyboardManager();game.keyboard._activateListeners();'});
  const source=await readFile(new URL('../dist/chat-cards.js',import.meta.url),'utf8');
  await page.addScriptTag({content:source.replace(/^import .*;\r?\n/gm,'').replace(/export /g,'')});
  await page.addScriptTag({content:(await readFile(new URL('../dist/chat-dice.js',import.meta.url),'utf8')).replace(/export /g,'')});
  await page.evaluate(async()=>{
    registerChatCards();registerChatDice();
    for(const [surface,ids] of [['log',['a','b']],['popout-log',['a','c']]]){
      for(const id of ids)document.getElementById(surface).append(...await game.messages.get(id).getHTML());
    }
    window.composer=document.getElementById('chat-message');
    window.cardReads=[];
  });
  const cycle=async expected=>{
    await page.keyboard.press('Alt+Shift+KeyC');
    await page.waitForFunction(expected=>values.chatSkin===expected,expected);
    await page.evaluate(()=>skinChanges);
    assert.equal(await page.evaluate(()=>selects),0,'cycle consumes both keyboard phases before token controls');
    assert.equal(await page.evaluate(()=>composer===document.getElementById('chat-message')&&composer.value==='Draft kept'),true);
    assert.equal(await page.locator('#chat-popout textarea').inputValue(),'Popout draft');
  };
  await cycle('cyberpunk');
  assert.equal(await page.locator('.pneuma-theme-cyberpunk.chat-message').count(),4);
  await page.locator('#log .chat-message').first().evaluate(el=>el.dataset.sameNode='yes');
  await cycle('technical');
  assert.equal(await page.locator('#log .chat-message').first().getAttribute('data-same-node'),'yes');
  assert.deepEqual(await page.evaluate(()=>cardReads),['a','b','a','c'],'enabled palette switch does not rebuild');
  await cycle('compact');
  assert.equal(await page.locator('.pneuma-skin-compact.chat-message').count(),4);
  assert.equal(await page.locator('#log .chat-message').first().getAttribute('data-same-node'),'yes');
  await cycle('compact-hub');
  assert.equal(await page.locator('.pneuma-skin-compact.pneuma-theme-cyberpunk.chat-message').count(),4);
  assert.equal(await page.locator('.pneuma-theme-technical.chat-message').count(),0);
  await cycle('off');
  assert.equal(await page.locator('.pneuma-chat-card, .pneuma-chat-composer, .pneuma-chat-portrait, .pneuma-chat-identity').count(),0);
  assert.deepEqual(await page.locator('.chat-message img').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src'))),Array(4).fill('systems/cyberpunk-red-core/icons/dice/black/d6_3.svg'));
  await cycle('cyberpunk');
  assert.equal(await page.locator('.pneuma-chat-card').count(),4,'OFF can be re-enabled through native keyboard dispatch');
  for(let i=0;i<10;i++)await page.keyboard.press('Alt+Shift+KeyC');
  await page.evaluate(()=>skinChanges);
  assert.equal(await page.evaluate(()=>values.chatSkin),'cyberpunk');
  assert.equal(await page.locator('.chat-message').count(),4,'rapid transitions do not duplicate mounted cards');
  assert.equal(await page.evaluate(()=>cardReads.includes('unmounted')),false);
  assert.equal(await page.evaluate(()=>renders),0,'does not rely on ChatLog.render');
  assert.equal(await page.evaluate(()=>selects),0);
  await page.locator('#log button').first().click();
  assert.equal(await page.evaluate(()=>actions),1,'fresh native controls retain their listeners');
  await page.evaluate(()=>{document.activeElement.blur();values.chatCards=false;});
  await page.keyboard.press('Alt+Shift+KeyC');
  assert.equal(await page.evaluate(()=>values.chatSkin),'cyberpunk');
  assert.equal(await page.evaluate(()=>selects),2,'disabled master setting yields both phases to other controls');
  console.log('Native v12 keyboard dispatch, conflict priority, complete OFF cycle, mounted-only card rebuild, composer/popout preservation, rapid presses and native handlers passed.');
} finally {await browser.close();}
