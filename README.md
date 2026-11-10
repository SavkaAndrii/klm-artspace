# KLM Art Space — frontend prototype

The existing site refactored in place with semantic HTML, CSS and vanilla JavaScript. No runtime dependencies, framework, build step, authentication, network submissions or database. The original warm palette, Georgia/system-sans typography, container width, photographs and responsive composition remain; the requested tabs, studio selection, sticky navigation and black credit footer are added.

## Files

```text
index.html                  Homepage; all text, photos, three studio panels
rezerwacja/index.html        Booking steps, form, summary, demo result
panel/index.html            Owner views, forms, request/dialog templates
css/reset.css               Small reset
css/style.css               Existing design rules plus navigation/tabs/forms
js/app.js                   Shared menu, section navigation, studio tabs, initialization
js/booking.js               One dedicated booking controller
js/panel.js                 Owner actions and isolated per-studio demo state
js/calendar.js              Shared date-cell/calendar controller
js/demo-data.js              In-memory data adapter, studios, services, demo fixtures
img/studio.jpg              Existing placeholder photograph
img/detail.jpg              Existing placeholder photograph
server.mjs                  Optional local static server; not used in deployment
package.json                Local preview and checks; no dependencies
.nojekyll                   Serve plain static files on GitHub Pages
tests/static.test.mjs       Relative-path, structure and demo-state checks
```

The old root `app.js` and `style.css` were replaced by the files above. Existing photographs moved from `assets/` to `img/`; no new photos were substituted. `preview.png` is a review screenshot, not a website dependency.

## Preview and checks

Requires Node.js 18+ only for the optional local tools. No `npm install` is needed.

```sh
npm run dev
```

Open `http://127.0.0.1:4173/`, `/rezerwacja/`, or `/panel/`. The trailing slash matters on static hosting. Requests without it redirect while preserving query parameters.

```sh
npm run check
npm run preview:subdirectory
```

The second preview serves the same files at `http://127.0.0.1:4174/klm-artspace/`. This checks repository-subdirectory behavior without changing production source paths. The local server is optional; any static HTTP server can serve these directories. Opening files directly with `file://` is not supported because browsers restrict JavaScript modules.

## Editing text and images

Edit visible homepage copy directly in `index.html`. Find sections by their class or ID:

- `.main-screen` — heading, introduction, buttons and hero image.
- `.about__section_1`, `#studio` — studio story and image.
- `.space__section_2`, `#przestrzen` — studio tabs and gallery.
- `.reservation__section_3`, `#rezerwacja` — homepage studio selector and booking-page handoff.
- `.kontakts__section_4`, `#kontakt` — address, email, telephone, Instagram and map placeholder.

Replace an image in `img/` or update its relative `src` and meaningful `alt` in HTML. Keep the `__img` wrapper, `__images` class, dimensions and lazy loading for below-fold photographs. The current photos are marked inspiration placeholders, not representations of the actual studio. Remove those labels only after replacing them with actual studio photos.

No logo file was supplied in the original brief. The existing text brand remains unchanged; replace the contents of `.header__logo` with the supplied original logo when available.

Headers and footers are deliberately static, repeated in all three pages. Edit their three copies together for now. Homepage links use `./`; booking and panel links use `../`. Keep exactly four `.menu__list-link` links with the existing `data-goto` selectors. Header-aware scrolling uses the real `.header.offsetHeight`, respects reduced motion, removes `_lock`, and closes the menu. Normal cross-page links preserve browser back/forward and direct reload behavior.

## Editing the three studios

In `index.html`, edit each `.space__panel` (`space-panel-1`, `space-panel-2`, `space-panel-3`) separately. Each panel contains its title, description, two images, equipment placeholder and reservation link. Preserve:

- the `role="tablist"`, `role="tab"` and `role="tabpanel"` relationships;
- unique matching `id`, `aria-controls`, and `aria-labelledby` values;
- a single selected tab and single unhidden panel;
- the stable studio IDs `space-1`, `space-2`, `space-3` in booking query parameters.

Click, Arrow Left/Right, Home and End switch tabs. If official names replace “Space 1–3”, update tab/panel labels, homepage studio selector, booking buttons and summary default, panel studio selectors, and `STUDIOS` in `js/demo-data.js`. Keep IDs unchanged so links remain valid. “Space” is the explicitly requested temporary room name; other UI copy stays Polish except the requested English developer credit.

## What remains demonstrational

- Studio/service selection, calendar, time slots, form validation, summary and result work in the browser. The homepage only selects a studio and passes its ID to the dedicated booking page; it does not duplicate booking logic.
- No booking is submitted or created. The result explicitly says nothing was reserved. Contact data is held only in the current form/DOM; it is cleared on completion or leaving the page and is never sent to the dashboard.
- Owner requests are fictional fixtures with `example.com` addresses. Approve, reject, modify and cancel only change in-memory fixtures. No notifications are sent.
- Each studio has an independent in-memory working-week, blocked dates, exceptional dates, working hours, blocked time, buffer and service/rule settings. Those controls preserve their demo values while switching studios in that panel instance; reloading resets them.
- Public booking and owner panel are separate page-local demos, not synchronized. Working hours, blocked times, price, duration, lead time and buffer settings do not generate or enforce public bookable slots. The public slot grid is deliberately a fixed sample.
- There is no authenticated area, payment, saved availability, email confirmation or reliable overlap prevention. The owner page is visibly a public prototype.
- The calendar starts at the browser's current local month. Fictional fixture dates are relative to today, not stale fixed business availability.

## Future WordPress / PHP / MySQL integration

HTML comments identify shared header/footer boundaries for future `header.php` and `footer.php`. Homepage content can become `front-page.php`; the two other files can become page templates. Existing `<template>` elements are reusable presentation components. CSS and ES modules can later be enqueued from the theme. No PHP or WordPress dependencies are introduced now.

Use the in-memory adapter in `js/demo-data.js` as the replacement boundary for a secure server API. The future backend must authenticate owner access and validate permissions, contact data, studio ID, date/time, configurable duration, opening hours, preparation buffer, booking rules and allowed status changes. Check and reserve overlapping intervals atomically in MySQL; never trust browser availability or client prices. Persist bookings with stable IDs, studio IDs, timezone, start/end, status and owner decisions. Add server-side validation, CSRF protection, abuse controls and privacy handling before collecting real customer information.

## Deploying to GitHub Pages

Nothing is uploaded by the preview or checks. Deploy manually when ready:

1. Place `index.html`, `rezerwacja/`, `panel/`, `css/`, `js/`, `img/` and `.nojekyll` at the root of the publishing branch. Keep their relative layout. Do not include `.DS_Store`, `._*` files or preview screenshots.
2. In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**.
3. Select the publishing branch (for example `main`) and **/(root)**, then save. No Node process or build command is needed on GitHub Pages.
4. Check the published URL, `/rezerwacja/` and `/panel/`, reload both subpages, and try header links and browser back/forward. Links automatically retain the repository prefix.

Official reference: [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Do not treat publishing this prototype as launching a real booking system.
