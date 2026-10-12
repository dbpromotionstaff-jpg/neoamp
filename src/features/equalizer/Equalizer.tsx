import { EQ_FREQS, EQ_PRESETS, usePlayer } from '../../stores/player'

export function Equalizer() {
  const { eq, preamp, setEq, setPreamp, preset } = usePlayer()
  const lbl = (f: number) => (f >= 1000 ? `${f / 1000}k` : `${f}`)
  return (
    <div className="panel p-2">
      <div className="flex items-center gap-2 mb-2 text-xs">
        <span className="label">EQ</span>
        <select aria-label="Equalizer preset" className="field" defaultValue="" onChange={(e) => e.target.value && preset(e.target.value)}>
          <option value="" disabled>Preset…</option>
          {Object.keys(EQ_PRESETS).map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex gap-2 items-end">
        <label className="eqcol"><input aria-label="Preamp" type="range" className="vslider" min={-12} max={12} step={0.5} value={preamp} onChange={(e) => setPreamp(+e.target.value)} /><span>Pre</span></label>
        {EQ_FREQS.map((f, i) => (
          <label key={f} className="eqcol"><input aria-label={`${f} Hz`} type="range" className="vslider" min={-12} max={12} step={0.5} value={eq[i]} onChange={(e) => setEq(i, +e.target.value)} /><span>{lbl(f)}</span></label>
        ))}
      </div>
    </div>
  )
}
