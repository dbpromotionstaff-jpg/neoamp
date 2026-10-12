# NeoAmp skin format (v0)
A skin is a CSS block keyed by `[data-theme=<name>]` that sets these variables:
`--bg --panel --fg --dim --accent --lcd --line`. Fonts are set via `[data-font=<name>]` → `--font`.
To add a skin: add a block in `src/index.css`, add the name to the `Theme` type in `src/stores/player.ts`
and an `<option>` in `src/components/Controls.tsx`. The user accent overrides `--accent` at runtime.
