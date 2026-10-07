import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { cp, lstat, mkdir, realpath, rm, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { check, root } from "./check.mjs";

await check();
const tsc = resolve(root, "node_modules/typescript/bin/tsc");
execFileSync(process.execPath, [tsc, "--noEmit"], { cwd: root, stdio: "inherit" });
const output = resolve(root, "dist");
const expectedOutput = resolve(await realpath(root), "dist");
let existing;
try { existing = await lstat(output); }
catch (error) { if (error.code !== "ENOENT") throw error; }
if (existing) {
  assert.ok(!existing.isSymbolicLink(), "Refusing to clean a linked output directory.");
  assert.equal(await realpath(output), expectedOutput, "Output must remain inside this project's dist directory.");
  await rm(output, { recursive: true });
}
await mkdir(output, { recursive: true });

await cp(resolve(root, 'src', 'soundboard.hbs'), resolve(output, 'soundboard.hbs'));
for (const file of ['theme-customizer.css', 'theme-customizer.hbs']) await cp(resolve(root, 'src', file), resolve(output, file));
for (const file of ['soundboard-folder.hbs', 'soundboard-tile.hbs']) await cp(resolve(root, 'src', file), resolve(output, file));
for (const file of ["module.json", "README.md", "CHANGELOG.md"]) {
  await cp(resolve(root, file), resolve(output, file));
}
for (const file of ["pneuma-visualtools.css", "chat-cards.css", "chat-hub.css", "chat-theme.css", "chat-dice.css", "chat-dice-settings.hbs", "chat-dice-template.zip", "en.json", "fire-loop.webm", "fire-loop-poster.png"]) {
  await cp(resolve(root, "src", file), resolve(output, file));
}
for (const file of (await readdir(resolve(root, "src"))).filter(name => /^(?:weapon-[a-z-]+|dice-pneuma-[a-z0-9_]+)\.webp$/.test(name))) {
  await cp(resolve(root, "src", file), resolve(output, file));
}
execFileSync(process.execPath, [tsc], { cwd: root, stdio: "inherit" });
const { RELEASE_FEATURES } = await import(pathToFileURL(resolve(output, 'release-features.js')).href);
const excluded = [];
if (!RELEASE_FEATURES.neuralIntrusion) excluded.push('intrusion-effects.js', 'neural-glitch.js');
if (!RELEASE_FEATURES.fireEffects) excluded.push('fire-effects.js', 'fire-overlay.js', 'fire-procedural.js', 'fire-loop.webm', 'fire-loop-poster.png');
for (const file of excluded) await rm(resolve(output, file), { force: true });
await check(output);
console.log("Built " + output);
