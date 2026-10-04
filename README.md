# BachataVan

Local website for BachataVan's Barcelona dance trips. Built with Next.js, React, and TypeScript, ready for a future Vercel deployment.

## Local preview

```sh
npm install
npm run dev
```

Open http://localhost:3000. Pages: `/`, `/calendar`, `/faq`.

## Edit business information

`src/data/site.ts` contains the trip times, SumUp payment links, pickup map, Instagram link, FAQs, and weekly schedule. Manisero Saturdays and Quechimba Sundays, and their payment URLs, were confirmed by the organizer during setup.

- Put the real public `https://chat.whatsapp.com/...` invite in `site.whatsappInvite`. The supplied `your-public-whatapp-link@here.com` is a placeholder, so community buttons currently open an Instagram contact dialog.
- Add ISO dates such as `2026-10-10` to `cancelledDates` to remove specific trips from the calendar.
- Calendar dates use Barcelona's timezone, regardless of the visitor's timezone. Recurring entries start October 4, 2026.
- Confirm pricing, venue admission, refunds, and cancellation terms before adding definitive policy copy. No seat availability or prices have been invented.
- Community rules are based on the organizer's supplied community-description screenshot: payment must be received to reserve a seat; departure is at the announced time with any wait capped at 10 minutes; respect is required; the responsible passenger pays for damage; only water is allowed; passengers are responsible for their belongings; good vibes are welcome while respecting the rules. Festivals and airport pickups are offered as inquiries, without assuming schedules or pricing.
- Payments open the confirmed hosted SumUp pages. There is no payment processing, passenger database, or live inventory in this project. A payment does not automatically update calendar availability or send a booking confirmation.
- The supplied WhatsApp screenshot's passenger names and phone numbers are not included in the website.

## Checks

```sh
npm run typecheck
npm run build
npm run test:e2e
```

The browser checks use local Google Chrome through Playwright and cover trip links, dialogs, recurring dates, past dates, calendar navigation, FAQs, and mobile overflow. To run on a machine without Chrome, install it or change the Playwright channel.

## Deployment

GitHub repository: [xhello/justicehire](https://github.com/xhello/justicehire). The Vercel project in the `justicehires-projects` workspace deploys its production site from `main`. BachataVan replaces the previous “Time, in person” application; that application remains available in Git history.

`vercel.json` specifies Next.js, `npm ci`, `npm run build`, and the `.next` output directory. Node.js 22 is selected in `package.json`. The application lives at the repository root. No application environment variables are required. `.vercelignore` excludes local development artifacts and tests from direct CLI uploads.

To publish later changes, run the checks above, commit the changes, and push `main`. Confirm the Vercel deployment status on the GitHub commit before considering an update live. Never commit API tokens or other credentials.

## Photography

These are illustrative stock dance photos, not images of BachataVan customers. Replace them with your own community photos when available.

- Hero: [Ardian Lumi on Unsplash](https://unsplash.com/photos/group-of-people-dancing-6Woj_wozqmA), [Unsplash License](https://unsplash.com/license).
- Community section: [Erika Reyes on Pexels](https://www.pexels.com/photo/man-and-woman-dancing-14100621/), [Pexels License](https://www.pexels.com/license/).
- Original image URLs and metadata: `public/images/credits.json`.

Fonts are served locally from Fontsource. No third-party analytics or tracking scripts are installed.
