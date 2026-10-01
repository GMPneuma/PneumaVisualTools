// Size/format conversion only; generated artwork and transparency are retained.
const fs = require('node:fs');
const sharp = require(process.env.PNEUMA_SHARP_MODULE || 'sharp');
const path = require('node:path');
async function main() {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  for (const job of jobs) {
    const output = path.resolve('src', job.file);
    const input = await fs.promises.readFile(job.path);
    await sharp(input).resize(512, 256, {fit:'contain', background:{r:0,g:0,b:0,alpha:0}}).webp({lossless:true}).toFile(output);
    const metadata = await sharp(output).metadata();
    if (metadata.width !== 512 || metadata.height !== 256 || !metadata.hasAlpha) throw Error('Invalid export: '+job.file);
    console.log(job.file);
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
