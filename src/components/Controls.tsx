import { useRef } from 'react'
import { usePlayer, type Theme, type VizStyle } from '../stores/player'
import { fmtTime } from '../utils/format'

export function Transport() {
  const { playing, toggle, stop, next, prev, shuffle, repeat, set } = usePlayer()
  const nextRepeat = { off: 'all', all: 'one', one: 'off' } as const
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Transport">
      <button className="btn" aria-label="Previous" onClick={prev}>⏮</button>
      <button className="btn btn-main" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle}>{playing ? '⏸' : '▶'}</button>
      <button className="btn" aria-label="Stop" onClick={stop}>⏹</button>
      <button className="btn" aria-label="Next" onClick={() => next()}>⏭</button>
      <button className={`btn ${shuffle ? 'on' : ''}`} aria-label="Shuffle" aria-pressed={shuffle} onClick={() => set({ shuffle: !shuffle })}>🔀</button>
      <button className={`btn ${repeat !== 'off' ? 'on' : ''}`} aria-label={`Repeat ${repeat}`} onClick={() => set({ repeat: nextRepeat[repeat] })}>{repeat === 'one' ? '🔂' : '🔁'}</button>
    </div>
  )
}

export function Seek() {
  const { position, duration, seek } = usePlayer()
  return <input aria-label="Seek" type="range" className="slider w-full" min={0} max={duration || 0} step={0.1} value={Math.min(position, duration || 0)} onChange={(e) => seek(+e.target.value)} />
}
export function Volume() {
  const { volume, setVolume } = usePlayer()
  return <input aria-label="Volume" type="range" className="slider" style={{ width: 90 }} min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(+e.target.value)} />
}
export function Time() {
  const { position, duration } = usePlayer()
  return <span className="lcd">{fmtTime(position)}<small> / {fmtTime(duration)}</small></span>
}
export function Title() {
  const { queue, index } = usePlayer()
  const t = queue[index]?.name ?? 'NeoAmp — tambahkan musik'
  return <div className="marquee" title={t}><span className={t.length > 30 ? 'scroll' : ''}>{t}</span></div>
}

export function OpenButtons() {
  const { addFiles } = usePlayer()
  const f = useRef<HTMLInputElement>(null), d = useRef<HTMLInputElement>(null)
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }
  return (
    <div className="flex gap-1">
      <button className="btn" onClick={() => f.current?.click()}>＋ File</button>
      <button className="btn" onClick={() => d.current?.click()}>＋ Folder</button>
      <input ref={f} type="file" multiple accept="audio/*,.flac,.mp3,.wav,.aac,.m4a,.ogg,.opus" hidden onChange={onPick} />
      <input ref={d} type="file" multiple hidden onChange={onPick} {...({ webkitdirectory: '' } as object)} />
    </div>
  )
}

export function Playlist() {
  const { queue, index, play, removeAt, clearQueue } = usePlayer()
  if (!queue.length) return <div className="panel empty">Antrian kosong. Seret file musik ke jendela ini, atau pakai tombol ＋ File / ＋ Folder.</div>
  return (
    <div className="panel plist" role="list" aria-label="Queue">
      <div className="flex justify-between text-xs px-2 py-1 label"><span>{queue.length} lagu</span><button className="link" onClick={clearQueue}>Kosongkan</button></div>
      {queue.map((t, i) => (
        <div key={t.id} role="listitem" className={`row ${i === index ? 'cur' : ''}`} onDoubleClick={() => play(i)}>
          <span className="num">{i + 1}</span><span className="grow trunc">{t.name}</span>
          <button className="link" aria-label={`Putar ${t.name}`} onClick={() => play(i)}>▶</button>
          <button className="link" aria-label={`Hapus ${t.name}`} onClick={() => removeAt(i)}>✕</button>
        </div>
      ))}
    </div>
  )
}

export function Settings() {
  const { theme, accent, font, vizStyle, sensitivity, fps, set } = usePlayer()
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label>Tema <select className="field" value={theme} onChange={(e) => set({ theme: e.target.value as Theme })}>
        <option value="classic">Classic</option><option value="neon">Neon</option><option value="minimal">Minimal</option><option value="light">Light</option></select></label>
      <label>Aksen <input type="color" aria-label="Accent color" value={accent ?? '#00e676'} onChange={(e) => set({ accent: e.target.value })} />
        {accent && <button className="link" onClick={() => set({ accent: null })}>reset</button>}</label>
      <label>Font <select className="field" value={font} onChange={(e) => set({ font: e.target.value as 'mono' | 'sans' })}><option value="mono">Mono</option><option value="sans">Sans</option></select></label>
      <label>Visual <select className="field" value={vizStyle} onChange={(e) => set({ vizStyle: e.target.value as VizStyle })}>
        <option value="spectrum">Spectrum</option><option value="bars">Bars</option><option value="wave">Waveform</option><option value="circle">Circular</option></select></label>
      <label>Sensitivitas <input type="range" className="slider" min={0.5} max={3} step={0.1} value={sensitivity} onChange={(e) => set({ sensitivity: +e.target.value })} /></label>
      <label>FPS <select className="field" value={fps} onChange={(e) => set({ fps: +e.target.value })}><option value={30}>30</option><option value={60}>60</option></select></label>
    </div>
  )
}
