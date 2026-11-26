# Project guidance

Use strict TypeScript under src/, Foundry v12 definitions, and pnpm.
Build scripts may use JavaScript. Never edit generated dist files.
Match the compiler-based tooling in PneumaCombatTools.
All generated runtime files belong directly in dist/, with no subfolders.
Keep IMPLEMENTED_FEATURES.md aligned with implemented behavior.
Prefer native Foundry functionality and minimal custom styling.
Be factual and concise. Never imply personal firsthand experience.

## Version branches and releases

Maintain Foundry v12 on main and develop v13 on foundry-v13, using the separate D:/Git/PneumaVisualTools-v12 and D:/Git/PneumaVisualTools-v13 folders. Preserve the existing releases/latest/download/module.json feed for v12. V13 releases must use a separate persistent manifest URL in both the update feed and packaged module, and be prereleases with make_latest=false until explicitly approved for launch. Publish matching assets before updating a manifest. This branch split alone does not establish v13 compatibility; only change compatibility after migration and validation. Selectively port v12 fixes into foundry-v13. Never merge the v13 migration into main while main maintains v12.

