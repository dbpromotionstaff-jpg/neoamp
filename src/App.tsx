import { useEffect } from 'react'
import { usePlayer, type Mode } from './stores/player'
import { Visualizer } from './features/visualizer/Visualizer'
import { Equalizer } from './features/equalizer/Equalizer'
import { OpenButtons, Playlist, Seek, Settings, Time, Title, Transport, Volume } from './components/Controls'

const SIZES: Record<Mode, [number, number]> = { classic: [440, 190], modern: [980, 640], mini: [360, 120] }

function ModeSwitch() {
  const { mode, set } = usePlayer()
  return <div className="flex gap-1" role="group" aria-label="Mode">{(['classic', 'modern', 'mini'] as Mode[]).map((m) =>
    <button key={m} className={`btn ${mode === m ? 'on' : ''}`} aria-pressed={mode === m} onClick={() => set({ mode: m })}>{m}</button>)}</div>
}

export default function App() {
  const { mode, theme, accent, font, showPlaylist, showEq, pinned, error, addFiles, set } = usePlayer()

  useEffect(() => {
    const r = document.documentElement
    r.dataset.theme = theme; r.dataset.font = font
    accent ? r.style.setProperty('--accent', accent) : r.style.removeProperty('--accent')
  }, [theme, font, accent])

  // resize / pin the native window (no-op in a plain browser)
  useEffect(() => {
    let [w, h] = SIZES[mode]
    if (mode === 'classic') h += (showPlaylist ? 220 : 0) + (showEq ? 150 : 0)
    ;(async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const { LogicalSize } = await import('@tauri-apps/api/dpi')
        const win = getCurrentWindow()
        await win.setSize(new LogicalSize(w, h))
        await win.setAlwaysOnTop(mode === 'mini' && pinned)
      } catch { /* not running inside Tauri */ }
    })()
  }, [mode, showPlaylist, showEq, pinned])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return
      const s = usePlayer.getState()
      if (e.code === 'Space') { e.preventDefault(); s.toggle() }
      else if (e.code === 'ArrowRight') s.seek(Math.min(s.duration, s.position + 5))
      else if (e.code === 'ArrowLeft') s.seek(Math.max(0, s.position - 5))
      else if (e.code === 'ArrowUp') s.setVolume(Math.min(1, s.volume + 0.05))
      else if (e.code === 'ArrowDown') s.setVolume(Math.max(0, s.volume - 0.05))
      else if (e.code === 'KeyN') s.next()
      else if (e.code === 'KeyB') s.prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const err = error && <div className="err" role="alert">{error}</div>
  const body =
    mode === 'mini' ? (
      <div className="p-2 flex flex-col gap-1 h-full">
        <div className="flex items-center gap-2"><div className="grow min-w-0"><Title /></div><Time /><button className={`btn ${pinned ? 'on' : ''}`} aria-label="Always on top" aria-pressed={pinned} onClick={() => set({ pinned: !pinned })}>📌</button><ModeSwitch /></div>
        <Seek />
        <div className="flex items-center justify-between"><Transport /><Volume /></div>
        {err}
      </div>
    ) : mode === 'classic' ? (
      <div className="p-2 flex flex-col gap-2">
        <div className="panel p-2 flex flex-col gap-1">
          <div className="flex items-center gap-2"><Time /><div className="grow min-w-0"><Title /></div><ModeSwitch /></div>
          <Visualizer className="h-12" />
          <Seek />
          <div className="flex items-center justify-between"><Transport /><Volume /></div>
          <div className="flex gap-1 justify-between"><OpenButtons />
            <div className="flex gap-1"><button className={`btn ${showEq ? 'on' : ''}`} aria-pressed={showEq} onClick={() => set({ showEq: !showEq })}>EQ</button>
              <button className={`btn ${showPlaylist ? 'on' : ''}`} aria-pressed={showPlaylist} onClick={() => set({ showPlaylist: !showPlaylist })}>PL</button></div></div>
        </div>
        {err}{showEq && <Equalizer />}{showPlaylist && <Playlist />}
      </div>
    ) : (
      <div className="flex h-full">
        <aside className="side">
          <div className="logo">NEO<b>AMP</b></div>
          <ModeSwitch /><OpenButtons />
          <div className="label mt-2">Pengaturan</div><Settings />
          <div className="mt-auto flex flex-col gap-1"><Volume /><button className={`btn ${showEq ? 'on' : ''}`} aria-pressed={showEq} onClick={() => set({ showEq: !showEq })}>Equalizer</button></div>
        </aside>
        <main className="grow flex flex-col gap-2 p-3 min-w-0">
          <div className="panel p-3 flex flex-col gap-2">
            <Title /><Visualizer className="h-56" /><Seek />
            <div className="flex items-center justify-between"><Transport /><Time /></div>
          </div>
          {err}{showEq && <Equalizer />}<Playlist />
        </main>
      </div>
    )

  return (
    <div className="app" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)) }}>
      {body}
    </div>
  )
}
