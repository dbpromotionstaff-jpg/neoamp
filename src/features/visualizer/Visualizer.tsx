import { useEffect, useRef } from 'react'
import { getAnalyser, usePlayer } from '../../stores/player'

export function Visualizer({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { vizStyle: style, sensitivity: sens, fps } = usePlayer()

  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!
    const freq = new Uint8Array(1024), wave = new Uint8Array(2048)
    const interval = 1000 / fps
    let raf = 0, last = 0
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - last < interval) return
      last = t
      const dpr = window.devicePixelRatio || 1
      const w = Math.max(1, Math.floor(c.clientWidth * dpr)), h = Math.max(1, Math.floor(c.clientHeight * dpr))
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
      g.clearRect(0, 0, w, h)
      const a = getAnalyser()
      if (!a) return
      a.getByteFrequencyData(freq); a.getByteTimeDomainData(wave)
      const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00e676'
      g.fillStyle = color; g.strokeStyle = color
      if (style === 'wave') {
        g.lineWidth = 2 * dpr; g.beginPath()
        for (let i = 0; i < wave.length; i += 2) {
          const x = (i / wave.length) * w, y = h / 2 + ((wave[i] - 128) / 128) * (h / 2) * sens
          i ? g.lineTo(x, y) : g.moveTo(x, y)
        }
        g.stroke()
      } else if (style === 'circle') {
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.25, n = 96
        g.lineWidth = Math.max(2, 3 * dpr)
        for (let i = 0; i < n; i++) {
          const v = Math.min(1, (freq[Math.floor((i * freq.length * 0.6) / n)] / 255) * sens)
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2
          g.beginPath()
          g.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)
          g.lineTo(cx + Math.cos(ang) * (r + v * r * 1.3), cy + Math.sin(ang) * (r + v * r * 1.3))
          g.stroke()
        }
      } else {
        const n = style === 'bars' ? 32 : 64, bw = w / n
        for (let i = 0; i < n; i++) {
          const idx = Math.floor(Math.pow(i / n, 2) * freq.length * 0.7)
          const bh = Math.min(1, (freq[idx] / 255) * sens) * h
          g.fillRect(i * bw + 1, h - bh, Math.max(1, bw - (style === 'bars' ? 4 * dpr : 2)), bh)
        }
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [style, sens, fps])

  return <canvas ref={ref} className={`viz ${className}`} aria-label="Audio visualizer"
    onDoubleClick={() => void ref.current?.requestFullscreen()} />
}
