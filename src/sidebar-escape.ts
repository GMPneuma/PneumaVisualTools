declare global {interface SettingConfig {'pneuma-visualtools.fixEscapeKey': boolean}}
const MODULE = 'pneuma-visualtools';
type EscapeWindow = {
  element: HTMLElement | {0?: HTMLElement};
  rendered: boolean;
  hasFrame?: boolean;
  close(options?: Application.CloseOptions & {closeKey?: boolean}): Promise<unknown>;
};
/** Keep Foundry's dismiss behavior, but restrict its close-all phase to one window. */
export function registerWindowEscapeProtection(): void {
  game.settings!.register(MODULE, 'fixEscapeKey', {
    name: 'Fix Escape Key',
    hint: "Override Foundry's ESC key to only close the current pop-up.  Also when on canvas with nothing selected, ESC will not present the Logout/Reload menu",
    scope: 'client', config: true, type: Boolean, default: true,
  });
  const enabled = (): boolean => game.settings!.get(MODULE, 'fixEscapeKey');
  const protectedApps = new WeakSet<object>();
  let escapeTarget: EscapeWindow | undefined;
  let escapeRoot: HTMLElement | null = null;
  const element = (app: EscapeWindow): HTMLElement | undefined => {
    return app.element instanceof HTMLElement ? app.element : app.element?.[0];
  };
  const protect = (app: EscapeWindow): void => {
    if (protectedApps.has(app)) return;
    protectedApps.add(app);
    const nativeClose = app.close;
    app.close = function (options): Promise<unknown> {
      if (enabled() && options?.closeKey && this !== escapeTarget && element(this) !== escapeRoot) return Promise.resolve();
      return nativeClose.call(this, options);
    };
  };
  const windows = (): EscapeWindow[] => {
    const classic = Object.values(ui.windows) as EscapeWindow[];
    const modern = foundry.utils.getProperty(foundry, 'applications.instances') as Map<string, EscapeWindow> | undefined;
    return [...new Set([...classic, ...(modern?.values() ?? [])])];
  };
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !enabled()) return;
    const apps = windows().filter(app => app.rendered && app.hasFrame !== false);
    if (!apps.length && game.view === 'game') {
      const controlled = foundry.utils.getProperty(canvas, 'activeLayer.controlled') as unknown[] | undefined;
      const preview = foundry.utils.getProperty(canvas, 'activeLayer.preview.children') as unknown[] | undefined;
      const canRelease = game.user?.isGM && !!controlled?.length && !preview?.length;
      const contextOpen = !!ui.context?.menu.length;
      if (!canRelease && !contextOpen && !Tour.tourInProgress) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }
    for (const app of apps) protect(app);
    const active = foundry.utils.getProperty(ui, 'activeWindow') as EscapeWindow | undefined;
    const focused = document.activeElement?.closest<HTMLElement>('.window-app, .application') ?? null;
    // Native front-window z-index reflects title-bar clicks, even with stale input focus.
    const top = apps.filter(app => element(app)?.isConnected).sort((a, b) => {
      const z = (app: EscapeWindow): number => Number(getComputedStyle(element(app)!).zIndex) || 0;
      return z(b) - z(a);
    })[0];
    escapeTarget = top ?? (active?.rendered ? active : apps.find(app => element(app) === focused));
    escapeRoot = escapeTarget ? element(escapeTarget) ?? null : focused;
  }, true);
  // Also protect explicit closeKey requests routed through native render hooks.
  for (const hook of ['renderSidebarTab', 'renderCompendium', 'renderApplication', 'renderApplicationV2']) Hooks.on(hook, protect);
}
