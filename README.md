# 10K Project | Running + Strength tracker

A phone-friendly, installable Progressive Web App (PWA) for a 19-week charity 10K training block.

- **Introductory weekend:** Saturday 21 November (upper-body compound lifting), Sunday 22 November (optional short easy run/walk).
- **Week 1:** Monday 23 November 2026.
- **Provisional race day:** Sunday 4 April 2027.
- **Weekly schedule:** Monday off, Tuesday easy run, Wednesday quality run (or recovery during weeks 1–4), Thursday Strength A, Friday easy run, Saturday Strength B, Sunday long run.
- **Features:** Full dated 19-week plan; session instructions; compound exercise prescriptions; actual run distance, RPE, knee-pain and notes logging; completed/skipped status; weekly progress; CSV/JSON exports; local-only storage; offline shell; Home Screen icon.
- **Tech:** Static HTML + CSS + vanilla JavaScript. No packages, subscriptions, API keys, logins, build commands or third-party libraries.

## Deploy to GitHub Pages (using GitHub in a browser)

1. Sign in to [github.com](https://github.com/) and create a new **public** repository, e.g. `10k-project`. A free account is enough for public GitHub Pages repositories. You can keep the README option off because this download includes one.
2. Extract the ZIP on your computer or device. Upload **all the files inside the `tenk-training-app` folder**, rather than uploading the ZIP or enclosing folder. In the repository select **Add file → Upload files**, drag the files in, and **Commit changes**. Ensure `index.html`, `app.js`, `styles.css`, and the icons sit at the repository root. Include hidden `.nojekyll` if your file manager permits; it is not essential for this simple site.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, then branch **`main`** and folder **`/(root)`**; save.
5. GitHub Pages will publish a URL like **`https://YOUR-USERNAME.github.io/10k-project/`**. The deployment may take a few minutes. Open the **Pages** section again to find the actual live link.
6. On iPhone, visit that address **in Safari**, open the **Share** menu, choose **Add to Home Screen**, and name it `10K Project`. If your Safari version shows an **Open as Web App** option, leave it on.

### When you change the code

Edit the files in the repository and commit. Reload the app when the GitHub Pages deployment completes. If you have installed the app on your Home Screen, close and reopen it. The service worker tries to fetch fresh files when online and uses cached ones when offline.

## Logging workouts

Open any running or strength session, enter your actual kilometres (for runs), RPE (effort out of 10), optional knee-pain rating (0–10), and notes. Choose **Complete** or **Skip**. You can reopen a session to edit the record. Rest days don't need logging.

The app stores progress in **this browser's `localStorage`**, not your GitHub repository or GitHub account. This means:
- The app doesn't sync your logs between devices or browsers.
- Deleting Safari website data can delete them.
- Use **Settings → Export backup** regularly. You can restore with **Import backup**. CSV export is also available for spreadsheets.
- Deploying new versions of the same website at the same address generally preserves existing logs.

## Adjusting the schedule

The dates and running workouts live near the top of `app.js`:

```js
const PLAN_START = '2026-11-23';
const INTRO_START = '2026-11-21';
const RACE_DATE = '2027-04-04';
const WEEK_DATA = [ /* week-by-week session descriptions and mileage */ ];
```

**Important:** `RACE_DATE` labels the event and countdown; the weekly session dates are generated from `PLAN_START`, and race day is **week 19 Sunday**. When the actual race date is confirmed, do **not** change `RACE_DATE` alone if the dates differ. Re-anchor `PLAN_START` and the week data together, or request a regenerated schedule. Session logs are keyed by calendar date, so back up your logs before a major rescheduling.

Compound exercise details are in `STRENGTH_A`, `STRENGTH_B`, `INTRO_B`, and `TAPER_UPPER` near the top of the same file.

## Clinical and training caveat

The plan deliberately avoids fast running in weeks 1–4 because of a recent history of knee pain, catching/popping sensations, posterior knee tightness, and big-toe pain. **Being scheduled for a physiotherapy appointment is not automatic clearance** for intense running. Do not run through worsening pain, locking, swelling, or gait change; get personalised advice and adapt as necessary. Mileage is illustrative, not a demand. If running tolerance is lower than assumed, keep or extend the early easy-running phase.

This is general exercise planning, not medical care or a guarantee of running a 42–45 minute 10K. The app assumes the device clock is correct.

## Files

| File | Purpose |
|---|---|
| `index.html` | The single-page app shell |
| `styles.css` | Responsive appearance |
| `app.js` | All training data and app logic |
| `manifest.webmanifest` | Home Screen app metadata |
| `sw.js` | Offline caching |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App icons |
| `.nojekyll` | Disable the default Jekyll build |

You can test it locally by serving this directory over HTTP, e.g. `python -m http.server 8000` and visiting `http://localhost:8000` on that computer. Service workers generally need a secure origin or localhost, so the final GitHub Pages URL (HTTPS) is recommended for installation and offline use.
