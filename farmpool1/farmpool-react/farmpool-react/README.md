# FarmPool — small farms, bulk orders

Buyers (hostel messes, canteens, restaurants) post what they need. FarmPool
**pools nearby farmers' listings into one order and splits it fairly**, so a
farmer with 60 kg can sell to a hostel that needs 450 kg.

**React + JavaScript only** (no Python). English and Tamil.

- Frontend: React 19, bundled with esbuild
- Backend: plain Node.js with **no npm packages at all** (just Node's built-in
  `http` and `fs`). The only things `npm install` downloads are React and esbuild.

## Run it (Windows)

Open a terminal **inside `farmpool1/farmpool-react/farmpool-react`**, the folder
that contains `package.json`, then:

```
npm install
npm start
```

Open **http://localhost:4300**. `npm start` builds the React app and starts the
server. The page only works while that terminal is running.

| Command | What it does |
|---|---|
| `npm start` | build the frontend, then run the server |
| `npm run dev` | rebuild on every save and restart the server when `server/` changes |
| `npm test` | run all 39 tests (needs no packages) |

Demo data is created on first run (fictional farmers and buyers; dates are
relative to today). Delete `db.json` to reset it.
Set `FARMPOOL_DB` to use a different database file.

### If something goes wrong

- **`npm error enoent ... package.json`** — you are in the wrong folder. `cd`
  into the folder that holds `package.json` (type `dir` to check).
- **Port 4300 already in use** — PowerShell: `$env:PORT=4400; npm start`
- **Windows blocks `esbuild.exe`** ("Application Control policy") — the build
  needs that one small program. Tell me and I'll switch to a setup without it.

## Folder layout

```
farmpool-react/
  package.json
  build.mjs  dev.mjs
  server/                   Node backend (no dependencies)
    index.js                http server: API + serves public/
    api.js                  routes + input validation
    service.js              business logic
    matching.js             the pooling algorithm (pure functions)
    catalog.js  seed.js  db.js  dates.js
  src/                      React app
    main.jsx  App.jsx
    LangContext.jsx         language + translated names + formatters
    AppData.jsx             crop/town lists, useFetch() data hook
    Toast.jsx  router.js  api.js  speech.js  format.js  validate.js
    i18n.js                 all English + Tamil text
    components/             Header, BottomBar, Modal, CropGrid, QuantityField,
                            ListingDialog, RequestDialog, PoolMeter,
                            AllocationTable, ExcludedList
    pages/                  OrdersPage, OrderPage, ListingsPage, PoolsPage
    styles.css
  public/index.html         page shell (build writes app.js + app.css here)
  test/                     matching, service and HTTP API tests
```

## How the React app is organised

- **Contexts** hold what many components need: `LangProvider` (language,
  `t()`, number/date formatting, Tamil names), `AppDataProvider` (crop and town
  lists, and a counter that makes every on-screen list reload after a change),
  `ToastProvider`.
- **`useFetch(path)`** loads data and keeps the old result on screen while it
  refreshes, so changing a filter doesn't flash an empty page.
- **Hash routing** (`#/`, `#/order/:id`, `#/listings`, `#/pools`) in ~15 lines
  — no router library needed, deep links and reload work.
- **Dialogs** use the browser's native `<dialog>` (dimmed backdrop, Escape key,
  focus trapping for free). Each open remounts the form, so it starts fresh.

## What makes it easy for farmers

- **Tamil / English toggle**, remembered, defaulting to the browser language.
  Crop and town names, error messages and even "why wasn't this farmer
  included" explanations are translated (the server sends reason *codes*, the
  browser phrases them).
- **Crop picture tiles** (🍅 🧅 🍆 …) and **+10 / +50 / +100 / +500** quantity buttons.
- **"Who can use my harvest?"** screen right after a farmer lists.
- **🔊 Listen**, **WhatsApp share**, and tap-to-call / WhatsApp on confirmed pools.
- Large text, 48px+ touch targets, a bottom action bar on phones.

## How the pooling works (`server/matching.js`)

1. **Eligibility.** Same crop, has stock, minimum price ≤ the buyer's offer,
   ready by the needed-by date, within the buyer's radius (haversine distance).
   Every rejected listing gets a reason code.
2. **Selection.** Nearest-first until stock covers the order; the rest stay on standby.
3. **Fair split.** *Equal first* (max-min fairness / "water-filling": small
   lots sell out completely, the rest is shared) or *by stock* (proportional).
   Rounded to 0.1 kg with the drift corrected so totals are exact.

A partly filled order can be topped up later when new farmers list.

## Honest limitations

- **Tamil needs a native review** before real use.
- **🔊 Listen** needs a voice for that language installed on the device.
- **No login.** Anyone can post listings or confirm a pool, and confirming
  reveals phone numbers. A real launch needs mobile-number OTP login.
- **WhatsApp share links** contain `localhost` until the app is deployed.
- One flat price per kg, straight-line (not road) distance, no transport-cost
  model. Payment and pickup happen outside the app.
- Towns come from a pick-list with approximate coordinates, not live maps.
- The JSON file store suits one server; use PostgreSQL/SQLite for real use.

## Adding another language (e.g. Hindi)

In `src/i18n.js` copy the `en` block into a new block and translate it, add
names to `CROP_NAMES`, `TOWN_NAMES`, `BUYER_TYPE_NAMES`; in `LangContext.jsx`
and `i18n.js` (`initialLang`) allow the new code; add a button in
`components/Header.jsx`.
