import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nextIndex, prevIndex, type Repeat } from '../utils/queue'
import { cleanName, isAudioFile } from '../utils/format'

export interface Track { id: string; name: string; url: string }
export type Mode = 'classic' | 'modern' | 'mini'
export type Theme = 'classic' | 'neon' | 'minimal' | 'light'
export type VizStyle = 'spectrum' | 'bars' | 'wave' | 'circle'
export const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [7, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  'Treble Boost': [0, 0, 0, 0, 0, 1, 3, 5, 6, 7],
  Vocal: [-2, -2, 0, 3, 5, 5, 3, 1, 0, -1],
}

// ---- audio engine: <audio> -> preamp -> 10x biquad EQ -> analyser -> output ----
const audio = new Audio()
audio.preload = 'auto'
let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let preampNode: GainNode | null = null
let filters: BiquadFilterNode[] = []
export const getAnalyser = () => analyser

function ensureGraph() {
  if (ctx) return
  ctx = new AudioContext()
  const src = ctx.createMediaElementSource(audio)
  preampNode = ctx.createGain()
  filters = EQ_FREQS.map((f) => {
    const b = ctx!.createBiquadFilter()
    b.type = 'peaking'; b.frequency.value = f; b.Q.value = 1.1
    return b
  })
  analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.8
  let node: AudioNode = src.connect(preampNode)
  filters.forEach((f) => { node.connect(f); node = f })
  node.connect(analyser); analyser.connect(ctx.destination)
  applyEq(usePlayer.getState().eq, usePlayer.getState().preamp)
}
function applyEq(eq: number[], preamp: number) {
  filters.forEach((f, i) => (f.gain.value = eq[i] ?? 0))
  if (preampNode) preampNode.gain.value = Math.pow(10, preamp / 20)
}

interface State {
  queue: Track[]; index: number; playing: boolean; position: number; duration: number; error: string | null
  volume: number; repeat: Repeat; shuffle: boolean
  mode: Mode; theme: Theme; accent: string | null; font: 'mono' | 'sans'
  vizStyle: VizStyle; sensitivity: number; fps: number
  eq: number[]; preamp: number; showPlaylist: boolean; showEq: boolean; pinned: boolean
  addFiles: (files: File[]) => void
  play: (i?: number) => void
  toggle: () => void; stop: () => void; next: (auto?: boolean) => void; prev: () => void
  seek: (t: number) => void; setVolume: (v: number) => void
  removeAt: (i: number) => void; clearQueue: () => void
  set: (p: Partial<State>) => void
  setEq: (i: number, v: number) => void; setPreamp: (v: number) => void; preset: (name: string) => void
}

export const usePlayer = create<State>()(
  persist(
    (set, get) => ({
      queue: [], index: -1, playing: false, position: 0, duration: 0, error: null,
      volume: 0.8, repeat: 'off', shuffle: false,
      mode: 'classic', theme: 'classic', accent: null, font: 'mono',
      vizStyle: 'spectrum', sensitivity: 1.2, fps: 60,
      eq: EQ_PRESETS.Flat, preamp: 0, showPlaylist: true, showEq: false, pinned: false,

      addFiles: (files) => {
        const ok = files.filter(isAudioFile)
        const skipped = files.length - ok.length
        const tracks = ok.map((f) => ({ id: crypto.randomUUID(), name: cleanName(f.name), url: URL.createObjectURL(f) }))
        const wasEmpty = get().queue.length === 0
        const start = get().queue.length
        set({ queue: [...get().queue, ...tracks], error: skipped ? `${skipped} file bukan audio dan dilewati.` : null })
        if (wasEmpty && tracks.length) get().play(start)
      },
      play: (i) => {
        const { queue, index } = get()
        const target = i ?? (index >= 0 ? index : 0)
        const t = queue[target]
        if (!t) return set({ error: 'Antrian kosong. Tambahkan file musik terlebih dahulu.' })
        ensureGraph(); void ctx!.resume()
        if (target !== index || !audio.src) { audio.src = t.url; set({ index: target, position: 0 }) }
        audio.play().then(() => set({ playing: true, error: null }))
          .catch(() => set({ playing: false, error: `Tidak bisa memutar "${t.name}" (format tidak didukung atau file hilang).` }))
      },
      toggle: () => { if (get().playing) { audio.pause(); set({ playing: false }) } else get().play() },
      stop: () => { audio.pause(); audio.currentTime = 0; set({ playing: false, position: 0 }) },
      next: (auto = false) => {
        const { index, queue, repeat, shuffle } = get()
        const n = nextIndex(index, queue.length, repeat, shuffle, auto)
        if (n === null) return get().stop()
        if (n === index) { audio.currentTime = 0; void audio.play() } else get().play(n)
      },
      prev: () => {
        if (audio.currentTime > 3) { audio.currentTime = 0; return }
        const p = prevIndex(get().index, get().queue.length)
        if (p !== null) get().play(p)
      },
      seek: (t) => { audio.currentTime = t; set({ position: t }) },
      setVolume: (v) => { audio.volume = v; set({ volume: v }) },
      removeAt: (i) => {
        const { queue, index } = get()
        URL.revokeObjectURL(queue[i]?.url ?? '')
        const q = queue.filter((_, k) => k !== i)
        if (i === index) { audio.pause(); audio.removeAttribute('src'); set({ queue: q, index: -1, playing: false, position: 0, duration: 0 }) }
        else set({ queue: q, index: i < index ? index - 1 : index })
      },
      clearQueue: () => {
        get().queue.forEach((t) => URL.revokeObjectURL(t.url))
        audio.pause(); audio.removeAttribute('src')
        set({ queue: [], index: -1, playing: false, position: 0, duration: 0 })
      },
      set: (p) => set(p),
      setEq: (i, v) => { const eq = [...get().eq]; eq[i] = v; set({ eq }); applyEq(eq, get().preamp) },
      setPreamp: (v) => { set({ preamp: v }); applyEq(get().eq, v) },
      preset: (name) => { const eq = EQ_PRESETS[name]; if (eq) { set({ eq }); applyEq(eq, get().preamp) } },
    }),
    {
      name: 'neoamp-settings',
      partialize: (s) => ({
        volume: s.volume, repeat: s.repeat, shuffle: s.shuffle, mode: s.mode, theme: s.theme, accent: s.accent,
        font: s.font, vizStyle: s.vizStyle, sensitivity: s.sensitivity, fps: s.fps, eq: s.eq, preamp: s.preamp,
        showPlaylist: s.showPlaylist, showEq: s.showEq, pinned: s.pinned,
      }),
    },
  ),
)

audio.addEventListener('timeupdate', () => usePlayer.setState({ position: audio.currentTime }))
audio.addEventListener('loadedmetadata', () => usePlayer.setState({ duration: audio.duration }))
audio.addEventListener('ended', () => usePlayer.getState().next(true))
audio.addEventListener('error', () => {
  const s = usePlayer.getState(); const t = s.queue[s.index]
  if (t) usePlayer.setState({ playing: false, error: `Gagal memuat "${t.name}". Format mungkin tidak didukung oleh webview sistem.` })
})
audio.volume = usePlayer.getState().volume
