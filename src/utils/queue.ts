export type Repeat = 'off' | 'one' | 'all'

/** Next queue index, or null when playback should stop. `auto` = track ended by itself. */
export function nextIndex(cur: number, len: number, repeat: Repeat, shuffle: boolean, auto = false, rnd = Math.random): number | null {
  if (len === 0) return null
  if (auto && repeat === 'one') return cur
  if (shuffle) {
    if (len === 1) return repeat === 'all' || !auto ? 0 : null
    return (cur + 1 + Math.floor(rnd() * (len - 1))) % len
  }
  const n = cur + 1
  if (n < len) return n
  return repeat === 'all' || !auto ? 0 : null
}

export function prevIndex(cur: number, len: number): number | null {
  if (len === 0) return null
  return cur > 0 ? cur - 1 : len - 1
}
