export interface FlameOverlay {start:(strength?:number)=>void;stop:()=>void}
/** Prerendered transparent video sections: no live heat simulation or frame loop. */
export function createFlameOverlay(assetBase:URL=new URL('.',import.meta.url)):FlameOverlay {
 let layer:HTMLDivElement|undefined,strength=1;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const clip=new URL('fire-loop.webm',assetBase).href,poster=new URL('fire-loop-poster.png',assetBase).href;
 const tiles:(HTMLVideoElement|HTMLImageElement)[]=[];
 function release(tile:HTMLVideoElement|HTMLImageElement){
  tile.remove();if(tile instanceof HTMLVideoElement){tile.pause();tile.removeAttribute('src');tile.load()}
 }
 function fit(){
  if(!layer)return;
  const tileWidth=Math.max(1,Math.min(260,innerHeight*.26))*900/270;
  const count=Math.max(1,Math.ceil(innerWidth/tileWidth));
  while(tiles.length>count)release(tiles.pop()!);
  while(tiles.length<count){
   const tile=reduced.matches?document.createElement('img'):document.createElement('video');
   Object.assign(tile.style,{flex:'0 0 auto',height:'100%',objectFit:'fill'});
   if(tile instanceof HTMLVideoElement){
    tile.muted=true;tile.loop=true;tile.playsInline=true;tile.preload='auto';tile.poster=poster;tile.src=clip;
    tile.addEventListener('error',()=>{tile.poster=poster});
    tile.addEventListener('loadedmetadata',()=>{if(layer&&tile.isConnected)void tile.play().catch(()=>{/* Poster remains if playback is unavailable. */})},{once:true});
   }else{tile.src=poster;tile.alt=''}
   tiles.push(tile);layer.append(tile);
  }
  tiles.forEach((tile,i)=>{tile.style.width=`${tileWidth}px`;tile.style.transform=i%2?'scaleX(-1)':''});
 }
 function stop(){for(const tile of tiles)release(tile);tiles.length=0;layer?.remove();layer=undefined}
 function start(level=1){
  strength=Math.max(1,Math.min(3,level));
  if(layer){layer.style.opacity=String(.65+strength*.08);return}
  if(document.hidden)return;
  layer=document.createElement('div');layer.id='pneuma-fire-overlay';layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{display:'flex',overflow:'hidden',position:'fixed',bottom:'0',left:'0',width:'100vw',height:'26vh',maxHeight:'260px',pointerEvents:'none',zIndex:'1',opacity:String(.65+strength*.08)});
  document.body.append(layer);fit();
 }
 window.addEventListener('resize',fit);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
 reduced.addEventListener('change',()=>{if(layer){stop();start(strength)}});
 return {start,stop};
}
