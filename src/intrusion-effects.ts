import {createIntrusionGlitches} from "./neural-glitch.js";
const MODULE = "pneuma-visualtools";
declare global { interface SettingConfig { "pneuma-visualtools.neuralIntrusionGlitches": boolean } }
interface CombatAPI {getNeuralIntrusionActor?: () => string | undefined}
export function registerIntrusionEffects(): void {
  const state = () => {
    if (!game.settings!.get(MODULE,"neuralIntrusionGlitches")) return;
    const combat = game.modules!.get("pneuma-combattools");
    if (!combat?.active) return;
    return (combat as unknown as {api?:CombatAPI}).api?.getNeuralIntrusionActor?.();
  };
  const glitches = createIntrusionGlitches(state);
  game.settings!.register(MODULE,"neuralIntrusionGlitches",{
    name:"Show Neural Intrusion screen effects", hint:"Personal preference. Localized screen distortion while your selected/default character has a detected Jack-In. Requires Combat Tools; turning this off stops the effect immediately. Respects reduced motion.",
    scope:"client",config:true,type:Boolean,default:true,onChange:()=>glitches.sync(),
  });
  Hooks.once("ready",()=>glitches.sync());
  Hooks.on("pneumaCombatToolsNeuralIntrusionChanged",()=>glitches.sync());
  Hooks.on("canvasReady",()=>glitches.sync());
  Hooks.on("canvasTearDown",()=>glitches.stop());
}
