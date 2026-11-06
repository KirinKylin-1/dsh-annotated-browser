## Add dsh-annotated-browser

- Repo: https://github.com/KirinKylin-1/dsh-annotated-browser
- npm: https://www.npmjs.com/package/dsh-annotated-browser
- Category: `browser`

What it does: provides the `browser` tab type for DSH. Pages are rendered by the
host's Chromium and served same-origin, so the panel can read the DOM and add an
annotation layer: click an element or drag a region, write the change, send the
batch into the current conversation. The stock browser is left untouched when
`takeover: false`; then the plugin adds a separate annotated tab and a 标注
hand-off button in the browser tab strip.

Checklist:
- [x] `dsh.bundle` manifest with `cordis.patch.yml`
- [x] real, working code (client half + host half, no other plugin required)
- [x] `dsh-plugin` topic on the repository
- [x] description matches the implementation
