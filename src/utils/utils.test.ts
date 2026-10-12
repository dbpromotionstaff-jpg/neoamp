import { describe, expect, it } from 'vitest'
import { nextIndex, prevIndex } from './queue'
import { fmtTime, isAudioFile, cleanName } from './format'

describe('queue', () => {
  it('advances and stops at end when repeat is off (auto)', () => {
    expect(nextIndex(0, 3, 'off', false, true)).toBe(1)
    expect(nextIndex(2, 3, 'off', false, true)).toBeNull()
  })
  it('wraps with repeat-all and on manual next', () => {
    expect(nextIndex(2, 3, 'all', false, true)).toBe(0)
    expect(nextIndex(2, 3, 'off', false, false)).toBe(0)
  })
  it('repeat-one replays only when track ends by itself', () => {
    expect(nextIndex(1, 3, 'one', false, true)).toBe(1)
    expect(nextIndex(1, 3, 'one', false, false)).toBe(2)
  })
  it('shuffle never repeats the current track when len > 1', () => {
    for (let i = 0; i < 50; i++) expect(nextIndex(1, 4, 'off', true, false)).not.toBe(1)
  })
  it('handles empty queue and prev wrap', () => {
    expect(nextIndex(0, 0, 'all', false)).toBeNull()
    expect(prevIndex(0, 3)).toBe(2)
    expect(prevIndex(2, 3)).toBe(1)
  })
})
describe('format', () => {
  it('formats time', () => { expect(fmtTime(65)).toBe('1:05'); expect(fmtTime(NaN)).toBe('--:--') })
  it('detects audio files', () => {
    expect(isAudioFile({ name: 'a.FLAC', type: '' })).toBe(true)
    expect(isAudioFile({ name: 'a.txt', type: 'text/plain' })).toBe(false)
  })
  it('cleans names', () => { expect(cleanName('my_song.mp3')).toBe('my song') })
})
