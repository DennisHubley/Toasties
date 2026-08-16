# Toasties website

A one-page website for the **Toasties** grilled-cheese trailer: menu, photos, Brett's story, and a
**Find the Trailer** section that pulls upcoming stops straight from a Google Calendar.

- No build step, no framework — plain HTML/CSS/JS in [`site/`](site/). Upload that folder anywhere.
- Everything Brett needs to change lives in two small files:
  - [`site/js/config.js`](site/js/config.js) — calendar connection, social links, email/phone.
  - [`site/js/menu.js`](site/js/menu.js) — menu items, prices, descriptions.

## Run it locally

Any static file server works. With Python (already on macOS):

```bash
python3 -m http.server 8765 --directory site
```

Then open <http://localhost:8765>. (Opening `index.html` directly from Finder also works for most of
the page, but the Google Calendar API call needs `http://` — use the server for that.)

## Connect Brett's Google Calendar (the "Find the Trailer" section)

The site reads a **public** Google Calendar. Brett keeps adding stops in Google Calendar like normal;
the website updates itself. There are two levels of setup:

| Setup | What visitors see |
|---|---|
| **Step 1 + 2 only** (calendar ID) | Google's own embedded agenda view (plain but works, ~5 min) |
| **Step 1 + 2 + 3** (calendar ID + API key) | Styled "Next stop" card + upcoming list, "Get directions" buttons, a "Next stop" chip in the hero (~15 min) |

Until a calendar ID is set, the site shows a clearly labelled **sample schedule** so you can see the design.

### Step 1 — Make the calendar public

1. Open [Google Calendar](https://calendar.google.com) on a computer.
2. Either create a new calendar just for the trailer (recommended — **Settings → Add calendar → Create new calendar**, name it "Toasties Schedule") or use an existing one.
3. In the left sidebar, hover the calendar → **⋮ → Settings and sharing**.
4. Under **Access permissions for events**, tick **Make available to public** and choose **See all event details**.

### Step 2 — Copy the Calendar ID

1. Still in that calendar's settings, scroll to **Integrate calendar**.
2. Copy the **Calendar ID**. It looks like `abc123xyz@group.calendar.google.com` (or `you@gmail.com` for a primary calendar).
3. Open [`site/js/config.js`](site/js/config.js) and paste it in:

```js
calendarId: "abc123xyz@group.calendar.google.com",
```

Save, refresh the site → the schedule now shows Google's embedded agenda. Done, unless you want the nicer view.

### Step 3 (optional, recommended) — Create an API key for the styled view

The API key lets the page fetch events and draw its own cards. It only ever reads public calendars,
and we lock it down so it can't be used for anything else.

1. Go to <https://console.cloud.google.com/> and sign in with the same Google account.
2. Create a project (top bar → project dropdown → **New project** → name it "Toasties Website").
3. **APIs & Services → Library** → search **Google Calendar API** → **Enable**.
4. **APIs & Services → Credentials → + Create credentials → API key**. Copy the key.
5. Click the key to edit it and lock it down:
   - **Application restrictions → Websites** → add your site's address, e.g.
     `https://toasties.ca/*` and `https://www.toasties.ca/*` (and `http://localhost:8765/*` while testing).
   - **API restrictions → Restrict key** → tick only **Google Calendar API**.
   - Save.
6. Paste it into [`site/js/config.js`](site/js/config.js):

```js
apiKey: "AIzaSy...",
```

Refresh → upcoming stops render as cards. If the key ever fails (typo, restriction mismatch), the page
automatically falls back to the embedded calendar, so the schedule is never blank.

> Because the site is static, the API key is visible to anyone who views the source. That's normal for
> browser keys — the website restriction in step 5 is what stops anyone else from using it.

### Adding stops so they look great on the site

- **Title** → the venue/event name, e.g. `Lunenburg Farmers' Market`.
- **Location** → the address or place name. This powers the **Get directions** button.
- **Time** → set real start/end times (or all-day). Stops disappear from the site once they've ended;
  a stop that's on right now shows a **Happening now** badge.
- **Description** (optional) → shows on the featured "next stop" card, e.g. today's Toastie of the Day.
- Cancelled events are hidden automatically.

## Editing the menu

Open [`site/js/menu.js`](site/js/menu.js). Each item is one line:

```js
{ name: "The Dilly", price: "8", desc: "The Classic with pickles and potato chips.", photo: "dilly.jpg", tag: "Fan favourite" },
```

- `price` is text — `"8.50"` is fine. `photo` (optional) is a file in `site/assets/gallery/`.
- `tag` (optional) shows a little label. `focus` (optional) nudges the round thumbnail's crop, e.g. `"50% 70%"`.
- Add-ons, sides, drinks and the footnotes are further down in the same file.

## Social links, email, phone

Fill in `instagram`, `facebook`, `email`, `phone` in [`site/js/config.js`](site/js/config.js).
Blank ones are hidden automatically (from the footer and the "Book Us" section).

## Photos

Web-sized images are generated from the originals in [`resources/`](resources/) by
[`scripts/build-images.sh`](scripts/build-images.sh) (macOS `sips`, no installs needed):

```bash
./scripts/build-images.sh
```

To add a new photo, drop the original in `resources/`, add a line to the script, re-run it, then reference
the output in `menu.js` (thumbnail) or `index.html` (gallery).

## Publishing

Upload the **contents of `site/`** to any static host. Easiest options:

- **Netlify Drop** — <https://app.netlify.com/drop>: drag the `site` folder onto the page. Free, instant URL, custom domain optional.
- **Cloudflare Pages / Vercel / GitHub Pages** — point them at the `site` folder.

After publishing, remember to add the live domain to the API key's website restrictions (Step 3.5 above).

## Project layout

```
site/                  ← the deployable website
  index.html           page structure and copy
  css/styles.css       all styling (brand palette at the top)
  js/config.js         ✏️ calendar + contact settings (Brett edits this)
  js/menu.js           ✏️ menu data (Brett edits this)
  js/app.js            renders menu, loads schedule, nav/lightbox/etc.
  assets/              web-optimized images (generated)
resources/             original brand assets, photos, owner write-up
scripts/build-images.sh  regenerates site/assets from resources/
```
