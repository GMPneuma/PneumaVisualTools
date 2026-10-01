import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export async function check(base = root) {
  const manifest = JSON.parse(await readFile(resolve(base, "module.json"), "utf8"));
  const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  assert.equal(manifest.id, "pneuma-visualtools");
  assert.equal(manifest.version, pkg.version);
  assert.equal(manifest.compatibility.minimum, "12");
  assert.equal(manifest.compatibility.maximum, "12");
  assert.ok(manifest.relationships.systems.some(system => system.id === "cyberpunk-red-core"));
  for (const asset of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(lang => lang.path)]) {
    assert.ok(!/[\\/]/.test(asset) && asset !== "..", "Assets must be directly in dist: " + asset);
    const sourceAsset = asset.endsWith(".js") ? asset.replace(/\.js$/, ".ts") : asset;
    const path = base === root ? resolve(root, "src", sourceAsset) : resolve(base, asset);
    assert.ok((await stat(path)).isFile(), "Missing asset: " + asset);
    if (base !== root && asset.endsWith(".js")) execFileSync(process.execPath, ["--check", path], { stdio: "inherit" });
    if (asset.endsWith(".json")) JSON.parse(await readFile(path, "utf8"));
  }
  if (base !== root) {
    for (const entry of await readdir(base, { withFileTypes: true })) {
      assert.ok(entry.isFile(), "dist must contain files only: " + entry.name);
    }
  }
  console.log("Validated " + manifest.id + " v" + manifest.version);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await check();
