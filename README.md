# Pixel Character Sheet Renderer

Composites a character sheet onto a canvas at native 583×1248 (your frame
art's actual size — nothing is ever scaled or stretched) and exports it
as a flat PNG to attach in Discord.

## Verify it's actually pixel-perfect
The first character loaded is a "Melanie" demo pre-filled with the exact
values from your reference mockup. Open `index.html`, hit **Download
PNG** immediately without changing anything, and diff that export
against your original reference image (e.g. drop both into
https://www.diffchecker.com/image-diff/, or just flip between them).
Every coordinate in `app.js`'s `LAYOUT` object was measured by diffing
your two reference PNGs pixel-by-pixel, not eyeballed — but you should
still confirm it before trusting it.

## Assets you still need to add
`assets/frame.png` is already in place (it's your empty template,
used as-is). Still missing:

| File | Used for |
|---|---|
| `assets/fonts/DeterminationSansWeb.woff2` (or `.ttf`) | All text. Falls back to monospace until this exists — you'll see a warning banner in the sidebar until it's found. |
| `assets/icons/heart_full.png`, `heart_empty.png` | Skill hearts (20×20 each) |
| `assets/icons/guts.png` | Guts icon (18×20), repeated per point, no empty variant |
| Anything for armor/trinkets/items/custom stat icons | Add image files to `assets/icons/`. When served over HTTP, the app discovers them automatically and adds them to the relevant pickers in the sidebar. `icontest.png` is also included as a fallback for hosts that do not expose directory listings. Normal icon slots render at 20×24. |
| Weapon's large equipped icon | Add image files to `assets/weapon-big/`. These are separate from the normal weapon icon and render at 26×36. |

Until an icon is picked for a slot, it renders as a plain purple square
(`#d281fc`) — matching the placeholder convention in your own mockup —
so the sheet is legible before all the art exists.

## Assumptions I made — flag anything that's wrong
- **Fixed slot counts**, matching what your template art has room for:
  10 item slots, 6 spell slots, 2 custom stat rows (between Speed and
  Guts). These aren't add/remove lists — the background art doesn't
  stretch, so the count is baked in. If you actually want a variable
  number of any of these, that needs a different approach (the frame
  can't be a single flat image anymore).
- **Charm's hearts**: your reference shows empty-full-full for a value
  of 2, not full-full-empty. I implemented straightforward left-to-right
  fill (first N hearts full) per your written rule. If you actually want
  per-heart manual toggles instead of one 0–3 number, say so.
- **Gray** for spell descriptions is plain `#808080` — no exact value
  was specified, easy to change in `LAYOUT.colors.gray`.
- Attack/Defense/Magic/Speed/Guts labels and icons (except Attack's,
  which is a picker) are left untouched — they're already baked into
  `frame.png`.

## Run it locally
Open `index.html` directly, or serve it (`python3 -m http.server`) if
your browser blocks local image loading.
Serve it (`python3 -m http.server`) so the app can discover image filenames from the icons directory. Opening `index.html` directly still works, but browsers do not allow a page loaded from `file://` to enumerate the folder, so only the fallback manifest is available in that mode.

## Deploy on GitHub Pages
1. Push this whole folder to a repo (`index.html` at the root, or in
   `docs/`).
2. Repo → **Settings → Pages** → Source: "Deploy from a branch" → pick
   the branch/folder.
3. GitHub gives you `https://yourname.github.io/reponame/`. Push again
   any time you edit, it redeploys in a minute or two.

## Using it
Each section in the sidebar (Header, Skills, Equipped, Items, Stats,
Spells) is collapsible. Pick icons from the dropdowns, type values,
watch the canvas update. **Download PNG** exports at native resolution
(583×1248, no upscaling) — attach that straight to a Discord message.
Everything is saved to that browser's local storage automatically, per
device (it won't sync between your phone and your computer on its own).
