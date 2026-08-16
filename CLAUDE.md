# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

The website for **Toasties**, a grilled-cheese food trailer on Nova Scotia's South Shore (owner:
Brett), plus the original brand assets it was built from.

- `site/` — the deployable static site (plain HTML/CSS/JS, **no build step, no dependencies**).
- `resources/` — original brand assets, photos, and the owner write-up (source material only; never
  served directly).
- `scripts/build-images.sh` — regenerates `site/assets/` from `resources/` with macOS `sips`.
- `README.md` — end-user guide for Brett (Google Calendar setup, editing the menu, publishing).

Not a git repository at the time of writing. `.DS_Store` files are macOS noise — ignore them.

## Commands

```bash
python3 -m http.server 8765 --directory site   # serve locally → http://localhost:8765
./scripts/build-images.sh                       # rebuild web images from resources/ (idempotent)
```

There are no tests or linters. `.claude/launch.json` defines the `toasties-site` preview server for the
in-app browser. Note: the in-app Browser pane sometimes fails to repaint after scrolling; for full-page
visual checks, headless Chrome (`--headless=new --screenshot --window-size=W,H`) is reliable.

## Site architecture

Three script files, loaded in order as classic scripts (no modules, so `file://` still works):

1. `site/js/config.js` → `window.TOASTIES_CONFIG` — **the only file Brett edits for settings**:
   `calendarId`, `apiKey`, `timeZone` (America/Halifax), `maxEvents`, socials/email/phone, catering blurb.
2. `site/js/menu.js` → `window.TOASTIES_MENU` — data-driven menu (`sections[]` with items, `addOns`,
   `sides`, `drinks`, `notes`). Prices are strings shown verbatim. `photo` maps to `assets/gallery/`,
   `focus` is an `object-position` for the round thumbnail.
3. `site/js/app.js` — an IIFE with a tiny `h()` DOM builder. Renders the menu into `#menu-root`,
   contact/social buttons, nav/reveal/lightbox, and the schedule.

**Schedule ("Find the Trailer") logic** in `app.js → loadSchedule()`, three tiers:
- No `calendarId` → renders clearly-labelled **sample events** (generated relative to today) so the
  design is visible. Not for production.
- `calendarId` only → Google's **iframe agenda embed** (`calendar.google.com/calendar/embed`).
- `calendarId` + `apiKey` → fetches Calendar API v3 `events.list` (`singleEvents`, `orderBy=startTime`,
  `timeMin = now-24h`), filters cancelled/ended events, renders a featured "next stop" card
  (`.stop--featured`) + "Coming up" list, populates the hero `#hero-next-stop` chip. **Any fetch/HTTP
  error falls back to the iframe embed** so the section is never blank. Descriptions are HTML-stripped
  via `DOMParser` (never inserted as HTML). All-day events use local-date formatting; timed events use
  `Intl.DateTimeFormat` in `config.timeZone`.

**CSS** (`site/css/styles.css`): design tokens at the top (`--cream`, `--yellow`, `--orange`,
`--brown`…), BEM-ish class names per section (`.hero__*`, `.menu-block`, `.stop`, `.gallery__*`).
Fonts: Bebas Neue (display) + Poppins (body) from Google Fonts. Gotchas already hit: children of the
hero grid need `min-width: 0` (nowrap chip otherwise widens the page on mobile); `z-index: -1`
pseudo-elements need `isolation: isolate` on the parent or they vanish behind section backgrounds.

**Gallery** is 3 tall + 6 regular tiles so it tiles a 4×3 grid exactly with `grid-auto-flow: dense`.
Adding tiles will leave gaps unless you keep that arithmetic.

**Images**: never link to `resources/` from the site. Add originals to `resources/`, add a line to
`scripts/build-images.sh`, re-run it. WebP isn't available via `sips`/ImageIO on this machine — JPEG for
photos, PNG only where transparency is needed (logo, trailer cutout).

## The business (from `resources/owner_writeup.txt` + menus)

(The transcribed menu below is mirrored in `site/js/menu.js` — that file is now the source of truth for
the website; the menu PNGs remain the source of truth for the physical trailer.)

- Owner/operator: **Brett** (20+ years in food industry). Bio text in `owner_writeup.txt` is the
  approved "About" copy — reuse it verbatim or lightly edited rather than rewriting it.
- Concept: made-to-order grilled cheese ("Toasties"). Signature: classic white bread grilled in
  **garlic parmesan butter**. Sweet items ("Sweet Melts") use **sourdough grilled in honey butter**.
- Sells at farmers' markets, beaches, festivals, and community events (mobile trailer — see photos).
- Emphasises **locally sourced ingredients**, especially in a rotating **Toastie of the Day** special.
  A chalkboard on the trailer lists the daily soup & special.
- Voice: warm, friendly, community-first, playful item names, Canadian spelling ("flavour").
  Sign-off: "Thanks for supporting local."
- Social: Facebook + Instagram (icons + QR on the menu; handles not in these files).

## Menu (transcribed from the menu PNGs — the PNGs are the source of truth)

All prices CAD, tax extra.

**Toasties** — classic white bread, garlic parmesan butter. Upgrade any to sourdough +$3.
| Item | Price | Description |
|---|---|---|
| The Classic | $7 | Two slices of cheese, shredded mozza & cheddar |
| The Dilly | $8 | The Classic with pickles and potato chips |
| The Tomater | $8.50 | The Classic with sliced tomato and fresh basil |
| The Sweet & Spicy | $9 | The Classic with jalapeno peppers and honey |
| The Golden Onion | $9 | The Classic with grainy mustard and caramelized onion |
| The Eggy | $12 | The Classic with fried egg and bacon |

**Add-ons** (any Toastie, or build your own): $1 — sliced tomato, potato chips, pickles, grainy
mustard, honey · $2 — caramelized onion, jalapeños, double cheese · $3 — fried egg, bacon (2 strips).

**Sweet Melts** — sourdough, honey butter.
| Item | Price | Description |
|---|---|---|
| The Funky Monkey | $11 | Banana, Nutella, and crunchy peanut butter |
| The Crunchy Nut | $12 | Crushed pretzels, Nutella, and crunchy peanut butter |
| The S'mores | $12 | Nutella, marshmallows, and graham crackers |
| The Grilled Elvis | $14 | Bacon, banana, and crunchy peanut butter |

**Sides**: popcorn $2, carrot sticks $2, potato chips $2, pickles $2.
**Drinks**: canned pop $2, sparkling water $2, bottled water $3.

## Original asset inventory (`resources/`) and gotchas

| File | What it is | Notes |
|---|---|---|
| `Toasties Sticker - Final.png` | 1200×1200 logo on transparent background with white sticker outline | **Best general-purpose logo** for web/print. |
| `Toasties Logo - Vector - Final.svg` | 1200×1200 Inkscape file | **Not a clean vector** — it is an auto-trace of the raster logo: ~98 `<path>`s, one flat fill each, **6 MB**. Do not inline it in HTML; if a scalable logo is needed, optimize (e.g. svgo) or re-trace/redraw first. |
| `Toasties - Horizontal Menu Update.png` | 5760×3456 landscape menu | Full menu, matches trailer signage. |
| `Toasties Menu Vertical Update.png` | 2880×6336 portrait menu | Same content, portrait layout. |
| `owner_writeup.txt` | Owner bio / About copy | Plain text, 3 paragraphs. |
| `IMG_*.jpeg/png` | iPhone photos (up to 4032×3024) | Food shots and the trailer with menu decals. |
| `<UUID>.jpeg/png` | Photos (~1024–1536 px), some styled/product shots | Includes plated sandwiches in front of the logo backdrop. |

Menu and photo files are large; resize/compress before shipping them on the web.

## Brand palette and type (sampled from the assets)

- Logo: cheese yellow `#FCCC00`, toast orange `#F87000`, dark-brown outline `#5C2400`.
- Menu: cream background `#FCE8D0`, tan/orange bands `#E0A05C`, heading brown `#7F3F00`–`#844808`.
- Type: logo is a yellow brush-script wordmark; menu headings are bold, letter-spaced condensed
  uppercase; body copy is a rounded geometric sans. Exact font names are not recorded in these files.
