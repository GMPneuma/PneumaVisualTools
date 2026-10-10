import {readFile,writeFile} from 'node:fs/promises';
const runtime=await readFile(new URL('../dist/weapon-effect-player.js',import.meta.url),'utf8');
const template=await readFile(new URL('./templates/combat-preview.html',import.meta.url),'utf8');
const html=template.replace('__WEAPON_RUNTIME__',()=>runtime);
// Keep both existing bookmarks on the same runtime-backed map preview.
for(const name of ['bullet-animation-preview.html','combat-sound-preview.html']){
 await writeFile(new URL('../docs/'+name,import.meta.url),html);
}
console.log('Generated both combat preview URLs from the built module runtime.');
