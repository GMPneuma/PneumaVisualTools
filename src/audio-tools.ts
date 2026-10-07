const MODULE = 'pneuma-visualtools';
function playlists(): Playlist[] { return Array.from(game.playlists ?? []); }
const ONCE_FLAG = MODULE + '.soundboardOnce';
function isOneShot(track: PlaylistSound): boolean { return foundry.utils.getProperty(track.flags, ONCE_FLAG) === true; }
export async function playSoundboardOnce(track: PlaylistSound): Promise<void> {
  if (!game.user?.isGM || track.parent?.mode !== CONST.PLAYLIST_MODES.DISABLED) return;
  const flag = `flags.${ONCE_FLAG}`;
  const stop = {playing: false, pausedTime: 0.0001, [flag]: true};
  const start = {playing: true, pausedTime: null, [flag]: true};
  if (track.playing) await track.update(stop);
  await track.update(start);
}
/** Apply the shared playback marker to each client's runtime Sound, preserving Repeat. */
export function registerSoundboardOnce(): void {
  const watched = new WeakSet<foundry.audio.Sound>();
  const nativeSync = PlaylistSound.prototype.sync;
  PlaylistSound.prototype.sync = function (): void {
    nativeSync.call(this);
    const sound = this.sound;
    if (!sound) return;
    if (!watched.has(sound)) {
      watched.add(sound);
      sound.addEventListener('play', () => {if (isOneShot(this)) sound.loop = false;});
    }
    if (sound.playing && isOneShot(this)) sound.loop = false;
  };
  const clearForNativePlay = (change: Record<string, unknown>): void => {
    const flag = `flags.${ONCE_FLAG}`;
    const marked = change[flag] === true || foundry.utils.getProperty(change, flag) === true;
    if (change.playing === true && !marked) change[flag] = false;
  };
  Hooks.on('preUpdatePlaylistSound', (_track: PlaylistSound, change: Record<string, unknown>, options: {pvtSeek?: boolean}) => {if (!options?.pvtSeek) clearForNativePlay(change);});
  Hooks.on('preUpdatePlaylist', (_playlist: Playlist, change: Record<string, unknown>) => {
    if (Array.isArray(change.sounds)) for (const sound of change.sounds) clearForNativePlay(sound as Record<string, unknown>);
  });
}
export function audioTime(seconds: number): string {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
export function parseAudioTime(value: string): number | null {
  if (!/^\d+(?::[0-5]\d){0,2}$/.test(value.trim())) return null;
  return value.trim().split(':').reduce((sum, part) => sum * 60 + Number(part), 0);
}
export async function seekAudio(track: PlaylistSound, seconds: number): Promise<void> {
  if (!game.user?.isGM) throw Error('Only the GM can change shared playback.');
  const duration = track.sound?.duration;
  if (!duration || !Number.isFinite(duration) || !Number.isFinite(seconds)) throw Error('Audio duration is unavailable.');
  const offset = Math.max(0, Math.min(seconds, Math.max(0, duration - 0.01)));
  const playing = track.playing;
  const options = {render: false, pvtSeek: true};
  if (playing) await track.update({playing: false, pausedTime: offset}, options);
  await track.update({playing, pausedTime: offset}, options);
  updateSidebarProgress();
  updateSoundboardIndicators();
}
export function updateSoundboardIndicators(): void {
  document.querySelectorAll<HTMLElement>('#pvt-soundboard [data-track]').forEach(row => {
    const track = game.playlists?.get(row.dataset.playlist ?? '')?.sounds.get(row.dataset.track ?? '');
    const button = row.querySelector<HTMLButtonElement>('.pvt-sound-tile');
    if (!track || !button) return;
    button.classList.toggle('playing', track.playing);
    button.disabled = !game.user?.isGM || !track.path || !!track.sound?.failed;
  });
}
function description(track: PlaylistSound): string {
  return String(track.description ?? '').trim() || String(foundry.utils.getProperty(track.flags, MODULE + '.soundDescription') ?? '').trim();
}
/** Separate from the native .sound-volume slider: values are seconds. */
export function mountSidebarProgress(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('#currently-playing .sound[data-sound-id]').forEach(row => {
    if (row.querySelector('[data-pvt-progress]')) return;
    const group = document.createElement('div'); group.className = 'pvt-sidebar-progress';
    group.dataset.pvtProgress = '';
    const slider = document.createElement('input'); slider.type = 'range';
    slider.min = '0'; slider.max = '0'; slider.step = '0.1'; slider.value = '0';
    slider.dataset.pvtSidebarSeek = ''; slider.setAttribute('aria-label', 'Playback position');
    slider.title = 'Playback position — drag or click to seek';
    const skipButton = (seconds: number): HTMLButtonElement => {
      const button = document.createElement('button'); button.type = 'button';
      button.dataset.pvtSidebarSkip = String(seconds);
      button.textContent = seconds < 0 ? '−20s' : '+20s';
      button.title = seconds < 0 ? 'Back 20 seconds' : 'Forward 20 seconds';
      button.setAttribute('aria-label', button.title);
      button.addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation();
        const track = game.playlists?.get(row.dataset.playlistId ?? '')?.sounds.get(row.dataset.soundId ?? '');
        if (!track || !game.user?.isGM || slider.dataset.seeking) return;
        slider.dataset.seeking = 'true'; slider.setAttribute('aria-busy', 'true');
        void seekAudio(track, (track.sound?.currentTime ?? track.pausedTime ?? 0) + seconds)
          .catch(error => ui.notifications?.error(String(error))).finally(() => {delete slider.dataset.seeking; slider.removeAttribute('aria-busy'); updateSidebarProgress(root);});
      });
      return button;
    };
    group.append(skipButton(-20), slider, skipButton(20)); row.append(group);
    slider.addEventListener('pointerdown', () => {slider.dataset.interacting = 'true';});
    slider.addEventListener('pointercancel', () => {delete slider.dataset.interacting;});
    slider.addEventListener('pointerup', () => {delete slider.dataset.interacting;});
    slider.addEventListener('input', () => {slider.dataset.interacting = 'true';});
    slider.addEventListener('blur', () => {delete slider.dataset.interacting;});
    slider.addEventListener('change', event => {
      event.stopPropagation(); delete slider.dataset.interacting;
      if (slider.dataset.seeking) return;
      const track = game.playlists?.get(row.dataset.playlistId ?? '')?.sounds.get(row.dataset.soundId ?? '');
      if (!track || !game.user?.isGM) return;
      slider.dataset.seeking = 'true'; slider.setAttribute('aria-busy', 'true');
      void seekAudio(track, Number(slider.value)).catch(error => ui.notifications?.error(String(error))).finally(() => {
        delete slider.dataset.seeking; slider.removeAttribute('aria-busy'); updateSidebarProgress(root);
      });
    });
  });
  updateSidebarProgress(root);
}
export function updateSidebarProgress(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('#currently-playing .sound[data-sound-id]').forEach(row => {
    const track = game.playlists?.get(row.dataset.playlistId ?? '')?.sounds.get(row.dataset.soundId ?? '');
    const slider = row.querySelector<HTMLInputElement>('[data-pvt-sidebar-seek]');
    if (!track || !slider || slider.dataset.seeking) return;
    const reportedDuration = track.sound?.duration;
    if (reportedDuration && Number.isFinite(reportedDuration)) slider.dataset.pvtDuration = String(reportedDuration);
    const duration = reportedDuration && Number.isFinite(reportedDuration) ? reportedDuration : Number(slider.dataset.pvtDuration);
    const current = track.sound?.currentTime ?? track.pausedTime ?? 0;
    const loaded = !!duration && Number.isFinite(duration);
    slider.disabled = !game.user?.isGM || !loaded;
    row.querySelectorAll<HTMLButtonElement>('[data-pvt-sidebar-skip]').forEach(button => {button.disabled = slider.disabled;});
    if (!slider.dataset.interacting) {
      slider.max = String(loaded ? duration : 0); slider.value = String(current);
    }
  });
}
export class Soundboard extends Application {
  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {id: 'pvt-soundboard', title: 'VT-Soundboard', width: 220, height: 320, resizable: false, template: `modules/${MODULE}/soundboard.hbs`});
  }
  override getData() {
    const data = {isGM: !!game.user?.isGM, boards: playlists().filter(p => p.mode === CONST.PLAYLIST_MODES.DISABLED && foundry.utils.getProperty(p.flags, MODULE + '.includeSoundboard') === true && p.visible).map(p => ({id: p.id, sounds: p.sounds.contents.map(s => ({id:s.id, name:s.name, description:description(s), playing:s.playing, missing:!s.path || s.sound?.failed, image:foundry.utils.getProperty(s.flags, MODULE + '.soundImage')}))}))};
    const expanded = foundry.utils.getProperty(game.folders ?? {}, '_expanded') as Record<string, boolean> | undefined;
    type Tile = (typeof data.boards)[number]['sounds'][number] & {playlist: string | null; isGM: boolean};
    type Branch = {id: string; uuid: string; name: string; color: string; collapsed: boolean; children: Branch[]; sounds: Tile[]};
    const folders = new Map<string, Branch>();
    const roots: Branch[] = [];
    const loose: Tile[] = [];
    const ensure = (folder: Folder): Branch => {
      const existing = folders.get(folder.id!); if (existing) return existing;
      const branch: Branch = {id: folder.id!, uuid: folder.uuid, name: folder.name ?? 'Folder', color: String(folder.color ?? ''), collapsed: !expanded?.[folder.uuid], children: [], sounds: []};
      folders.set(branch.id, branch);
      if (folder.folder) ensure(folder.folder).children.push(branch); else roots.push(branch);
      return branch;
    };
    for (const board of data.boards) {
      const playlist = game.playlists?.get(board.id!); if (!playlist) continue;
      const tiles = board.sounds.map(sound => ({...sound, playlist: board.id, isGM: data.isGM}));
      if (playlist.folder) ensure(playlist.folder).sounds.push(...tiles); else loose.push(...tiles);
    }
    const sort = (branches: Branch[]): void => {
      branches.sort((a, b) => a.name.localeCompare(b.name));
      for (const branch of branches) sort(branch.children);
    };
    sort(roots);
    return {...data, folders: roots, loose, hasSounds: data.boards.length > 0};
  }
  override activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html[0]?.querySelectorAll<HTMLButtonElement>('[data-action="play"]').forEach(button => button.addEventListener('click', () => {
      if (!game.user?.isGM) return;
      const row = button.closest<HTMLElement>('[data-track]');
      const track = game.playlists?.get(row?.dataset.playlist ?? '')?.sounds.get(row?.dataset.track ?? '');
      if (!track) return;
      button.disabled = true;
      void playSoundboardOnce(track).catch(error => ui.notifications?.error(String(error))).finally(() => {button.disabled = false;});
    }));
    html[0]?.querySelectorAll<HTMLElement>('.folder-header').forEach(header => {
      const toggle = (event: Event): void => {
        event.preventDefault();
        const native = ui.playlists as unknown as {_toggleFolder(event: Event): void};
        native._toggleFolder.call(this, event);
        header.setAttribute('aria-expanded', String(!header.parentElement?.classList.contains('collapsed')));
      };
      header.addEventListener('click', toggle);
      header.addEventListener('keydown', event => {if (event.key === 'Enter' || event.key === ' ') toggle(event);});
    });
  }
}

let soundboardApp: Soundboard;
export function toggleSoundboard(): void {
  soundboardApp ??= new Soundboard();
  if (soundboardApp.rendered) void soundboardApp.close(); else soundboardApp.render(true);
}
export function registerAudioTools(): void {
  registerSoundboardOnce();
  game.keybindings!.register(MODULE, 'toggleSoundboard', {
    name: 'Toggle VT-Soundboard', hint: 'Open or close the compact soundboard.',
    editable: [{key: 'KeyS', modifiers: ['Alt', 'Shift']}],
    onDown: () => {toggleSoundboard(); return true;}, restricted: true,
  });
  Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
    const tokens = controls.find(control => control.name === 'token');
    if (!tokens || tokens.tools.some(tool => tool.name === 'vt-soundboard')) return;
    tokens.tools.push({name: 'vt-soundboard', title: 'VT-Soundboard', icon: 'fas fa-volume-up', button: true, visible: !!game.user?.isGM, onClick: toggleSoundboard});
  });
  Hooks.on('renderPlaylistDirectory', (_app: unknown, html: JQuery) => {
    const root = html[0]; if (!root) return;
    mountSidebarProgress(root);
    if (root.querySelector('[data-pvt-soundboard-open]')) return;
    const boardButton = document.createElement('button'); boardButton.type = 'button'; boardButton.dataset.pvtSoundboardOpen = '';
    const nativeButton = root.querySelector<HTMLButtonElement>('.directory-footer button, .directory-header button');
    if (nativeButton) boardButton.className = nativeButton.className;
    boardButton.innerHTML = '<i class="fas fa-volume-up" aria-hidden="true"></i> VT-Soundboard';    boardButton.title = 'Toggle VT-Soundboard (Alt+Shift+S; configurable in Configure Controls)';
    boardButton.addEventListener('click', toggleSoundboard);
    (root.querySelector('.directory-header') ?? root).prepend(boardButton);
  });
  Hooks.on('renderPlaylistConfig', (app: PlaylistConfig, html: JQuery) => {
    const root = html[0]; if (!root || !game.user?.isGM || root.querySelector('[data-pvt-include-soundboard]')) return;
    const group = document.createElement('div'); group.className = 'form-group'; group.dataset.pvtIncludeSoundboard = '';
    const label = document.createElement('label'); label.textContent = 'Include in VT-Soundboard';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.name = `flags.${MODULE}.includeSoundboard`;
    checkbox.checked = foundry.utils.getProperty(app.object.flags, MODULE + '.includeSoundboard') === true;
    group.append(label, checkbox); const submit = root.querySelector('button[type="submit"]'); if (submit) submit.before(group); else root.append(group);
    const mode = root.querySelector<HTMLSelectElement>('[name="mode"]');
    const syncAvailability = (): void => {
      const available = Number(mode?.value ?? app.object.mode) === CONST.PLAYLIST_MODES.DISABLED;
      group.hidden = !available;
      checkbox.disabled = !available;
    };
    mode?.addEventListener('change', syncAvailability);
    syncAvailability();
  });
  Hooks.on('renderPlaylistSoundConfig', (app: PlaylistSoundConfig, html: JQuery) => {
    const root = html[0]; if (!root || !game.user?.isGM || root.querySelector('[data-pvt-sound-image]')) return;
    for (const [key, labelText] of [['soundImage', 'Soundboard image path']] as const) {
      const group = document.createElement('div'); group.className = 'form-group'; group.dataset.pvtSoundImage = '';
      const label = document.createElement('label'); label.textContent = labelText;
      const input = document.createElement('input'); input.name = `flags.${MODULE}.${key}`; input.value = String(foundry.utils.getProperty(app.object.flags, MODULE + '.' + key) ?? '');
      group.append(label);
      if (key === 'soundImage') {
        const fields = document.createElement('div'); fields.className = 'form-fields';
        const browse = document.createElement('button'); browse.type = 'button'; browse.className = 'file-picker';
        browse.title = 'Browse soundboard images'; browse.setAttribute('aria-label', browse.title);
        const icon = document.createElement('i'); icon.className = 'fas fa-file-import'; icon.setAttribute('aria-hidden', 'true'); browse.append(icon);
        browse.addEventListener('click', event => {
          event.preventDefault();
          new FilePicker({type: 'image', current: input.value, callback: path => {input.value = path; input.dispatchEvent(new Event('change', {bubbles: true}));}}).render(true);
        });
        fields.append(input, browse); group.append(fields);
      } else group.append(input);
      const submit = root.querySelector('button[type="submit"]'); if (submit) submit.before(group); else root.append(group);
    }
  });
  const refresh = (): void => {if (soundboardApp?.rendered) soundboardApp.render(false);};
  for (const hook of ['createPlaylist', 'updatePlaylist', 'deletePlaylist', 'createPlaylistSound', 'deletePlaylistSound']) Hooks.on(hook, refresh);
  Hooks.on('updatePlaylistSound', (_track: PlaylistSound, _change: unknown, options: {pvtSeek?: boolean}) => {
    if (options?.pvtSeek) {updateSidebarProgress(); updateSoundboardIndicators();} else refresh();
  });
  for (const hook of ['createFolder', 'updateFolder', 'deleteFolder']) Hooks.on(hook, refresh);
  Hooks.once('ready', async () => {await loadTemplates([`modules/${MODULE}/soundboard-folder.hbs`, `modules/${MODULE}/soundboard-tile.hbs`]);});
  Hooks.once('ready', () => {setInterval(() => {updateSidebarProgress();}, 500);});
}




