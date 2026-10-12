# NeoAmp
Pemutar musik desktop bergaya Winamp modern: Tauri 2 + React + TypeScript + Vite + Tailwind + Zustand.

## Cara mendapatkan .exe (tanpa install apa pun di PC)
1. Buat repo baru di GitHub, lalu push seluruh isi folder ini (`git init && git add . && git commit -m init && git push`).
2. Buka tab **Actions** → workflow **Build Windows installer** → **Run workflow**. (Atau push tag, mis. `git tag v0.1.0 && git push --tags`.)
3. Tunggu ±10 menit (build Rust pertama lambat). Unduh artifact **NeoAmp-windows**: berisi installer `NeoAmp_0.1.0_x64-setup.exe` dan `neoamp.exe` portabel.
   Windows SmartScreen akan memperingatkan karena belum ditandatangani (code signing). Klik "More info → Run anyway".

## Development lokal
Butuh Node 20+, Rust stable, dan prasyarat Tauri 2 (Windows: WebView2 + MSVC Build Tools; macOS: Xcode CLT).
```
npm install
npm run tauri dev      # jalankan app desktop
npm test               # unit test (Vitest)
npm run tauri build    # installer (Windows: NSIS .exe; macOS: jalankan di Mac, ubah targets ke ["app","dmg"])
```
`npm run dev` menjalankan UI saja di browser (resize/pin jendela native tidak aktif).

## Yang sudah berfungsi
- Pemutar lokal: buka file/folder, drag & drop, antrian, play/pause/stop/prev/next, seek, volume, shuffle, repeat off/all/one, penanganan error format/file.
- Tiga mode (Classic, Modern, Mini) dengan state & antrian yang sama; Mini bisa always-on-top; ukuran jendela menyesuaikan mode.
- Visualizer dari sinyal audio asli (AnalyserNode): spectrum, bars, waveform, circular; sensitivitas & FPS; fullscreen dengan klik dua kali pada visualizer.
- Equalizer 10 band + preamp + 4 preset (filter BiquadFilter asli pada jalur audio).
- Tema: Classic, Neon, Minimal, Light; warna aksen kustom; font mono/sans. Format skin: `docs/SKINS.md`.
- Pengaturan tersimpan (localStorage). Pintasan keyboard: Space, ←/→ seek, ↑/↓ volume, N/B next/prev.

## Belum selesai / batasan (urutan prioritas)
1. **Spotify** — belum diimplementasikan (OAuth PKCE, pencarian, playlist, Web Playback SDK/Connect; butuh Client ID dan akun Premium untuk pemutaran). Pemutaran lokal tidak bergantung padanya.
2. **Playlist & antrian tersimpan** — saat ini hanya pengaturan yang persisten. Perlu plugin fs/SQLite Tauri untuk menyimpan path file asli (URL blob hilang saat app ditutup), posisi terakhir, dan library scan.
3. **Metadata & cover art** — saat ini judul diambil dari nama file; belum membaca tag ID3/FLAC.
4. **Tray, media key global, launch at startup, ingat posisi jendela** — butuh fitur/plugin Rust Tauri (tray-icon, global-shortcut, autostart, window-state); belum ditambahkan.
5. **Visualizer neon particle**, transparansi jendela, balance, ReplayGain, pilihan output device — belum ada (tidak ditampilkan sebagai kontrol palsu).
6. **Codec**: pemutaran memakai webview sistem (WebView2 di Windows, WebKit di macOS). MP3/WAV/AAC umumnya aman; FLAC/OGG/Opus tergantung versi OS/webview.
7. **Belum teruji di Windows/macOS sungguhan** (kode Rust minimal dan konfigurasi Tauri ditulis tanpa kompilasi lokal). Lihat log CI jika build gagal.
8. macOS: perlu Apple Developer ID + notarization untuk distribusi; Windows: sertifikat code signing untuk menghilangkan SmartScreen.
