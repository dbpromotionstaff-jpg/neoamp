export function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '--:--'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
export const AUDIO_EXT = /\.(mp3|flac|wav|aac|m4a|ogg|opus|oga|weba)$/i
export function isAudioFile(f: { name: string; type: string }): boolean {
  return f.type.startsWith('audio/') || AUDIO_EXT.test(f.name)
}
export function cleanName(name: string): string {
  return name.replace(AUDIO_EXT, '').replace(/[_]+/g, ' ')
}
