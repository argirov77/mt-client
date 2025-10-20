# Maksimov Tours Client

A multilingual ticketing interface for the Maksimov Tours platform built with Next.js 15 and Tailwind CSS 4. The application allows travellers to search for coach routes, select seats, reserve or purchase journeys, and download electronic tickets in multiple languages.

## Table of contents
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Available scripts](#available-scripts)
- [Key application flows](#key-application-flows)
- [Internationalisation](#internationalisation)
- [Troubleshooting](#troubleshooting)

## Features
- **Route discovery** – interactive hero section with cascading dropdowns that fetch available departures, arrivals, and dates from the API while keeping selections in sync.【F:src/components/hero/SearchForm.tsx†L14-L199】【F:src/components/hero/HeroSection.tsx†L12-L80】
- **Seat selection** – responsive seat maps for different coach layouts (Neoplan, Travego) with baggage options, availability status, and automatic refresh when a tour changes.【F:src/components/SeatClient.tsx†L1-L99】【F:src/components/SeatClient.tsx†L178-L220】
- **Booking and payments** – end-to-end flow that searches tours, manages reservations, triggers payments, and supports cancellation directly from the client UI.【F:src/components/search/SearchResults.tsx†L1-L116】【F:src/components/search/SearchResults.tsx†L389-L724】
- **Electronic tickets** – generates downloadable PDF tickets and shows structured trip details once a booking is confirmed.【F:src/components/search/SearchResults.tsx†L10-L16】【F:src/components/search/SearchResults.tsx†L441-L666】
- **Multilingual experience** – runtime language switcher with persisted preference, translations for Russian, Bulgarian, English, and Ukrainian across the site.【F:src/components/common/LanguageProvider.tsx†L1-L63】【F:src/translations.ts†L1-L39】
- **Marketing pages** – rich landing sections (routes, schedule, about) optimised for showcasing the company offering.【F:src/app/(site)/page.tsx†L1-L34】【F:src/components/Schedule.tsx†L1-L93】

## Tech stack
- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/) with React 19.【F:package.json†L1-L26】
- **Language:** TypeScript with strict typing for UI state and API responses.【F:src/components/SeatClient.tsx†L1-L63】
- **Styling:** Tailwind CSS v4 with modern utility-first classes.【F:package.json†L17-L25】【F:src/app/(site)/page.tsx†L13-L31】
- **HTTP client:** Axios for data fetching alongside the native `fetch` API where appropriate.【F:src/components/hero/SearchForm.tsx†L5-L123】【F:src/components/SeatClient.tsx†L45-L83】

## Project structure
```
src/
  app/             # App Router routes for the public site, ticket view, purchase flow, and cabinet pages
  components/      # Reusable UI pieces (hero, search, booking, layout-specific seat maps, shared widgets)
  types/           # TypeScript interfaces for tickets, bookings, and supporting data models
  utils/           # Helpers such as ticket PDF generation and formatting utilities
  i18n.ts          # Language dictionaries for hero and supporting content
  config.ts        # Client-side configuration (API base URL)
```
【F:src/app/(site)/page.tsx†L1-L34】【F:src/components/SeatClient.tsx†L1-L99】【F:src/types/ticket.ts†L1-L32】【F:src/utils/ticketPdf.ts†L1-L34】【F:src/config.ts†L1-L1】

## Getting started
1. **Install Node.js** 18.17 or later (Next.js 15 requirement).
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. Visit [http://localhost:3000](http://localhost:3000) to access the app.

To create an optimised production build run `npm run build` followed by `npm start`.

## Environment configuration
The client expects a Maksimov Tours API to be available. Configure the base URL in `src/config.ts`:
```ts
export const API = "http://localhost:8000";
```
【F:src/config.ts†L1-L1】

Endpoints consumed by the UI:
| Purpose | Method & Path | Used from |
| --- | --- | --- |
| Fetch departure stops | `POST /search/departures` | Search form cascading dropdowns【F:src/components/hero/SearchForm.tsx†L81-L90】 |
| Fetch arrival stops | `POST /search/arrivals` | Updates destination options when departure changes【F:src/components/hero/SearchForm.tsx†L95-L108】 |
| Fetch available dates | `GET /search/dates` | Enables date pickers for outbound and return legs【F:src/components/hero/SearchForm.tsx†L116-L120】 |
| Search tours | `GET /tours/search` | Retrieves outbound and return trip lists【F:src/components/search/SearchResults.tsx†L389-L414】 |
| Manage bookings | `POST /tours/book`, `POST /tours/purchase`, `POST /pay`, `POST /cancel/:purchase_id` | Handles reservation lifecycle【F:src/components/search/SearchResults.tsx†L582-L723】 |
| Load seat map | `GET /seat` | Displays real-time seat availability for a selected tour【F:src/components/SeatClient.tsx†L45-L83】 |
| Fetch schedule highlights | `POST /selected_pricelist` | Populates marketing schedule section【F:src/components/Schedule.tsx†L72-L93】 |

Adjust the URL or proxy configuration according to your backend deployment.

## Available scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server with hot reloading. |
| `npm run build` | Build the production bundle. |
| `npm run start` | Run the compiled production build. |
| `npm run lint` | Lint the codebase with ESLint and Next.js configuration. |
【F:package.json†L5-L26】

## Key application flows
- **Search → Seat selection → Booking:** Users start from the hero module, choose their route and dates, inspect outbound/return options, open seat selection, and proceed to booking or instant purchase.【F:src/components/hero/HeroSection.tsx†L14-L71】【F:src/components/search/SearchResults.tsx†L389-L724】
- **Electronic ticket retrieval:** After a purchase, the app shows the ticket summary and provides a PDF download generated on demand via `ticketPdf` utilities.【F:src/components/search/SearchResults.tsx†L441-L666】【F:src/utils/ticketPdf.ts†L1-L34}
- **Account & after-sales:** Cabinet and ticket routes (see `src/app/cabinet` and `src/app/ticket`) surface existing bookings and support payment or cancellation via the same API endpoints.【F:src/app/cabinet/page.tsx†L1-L69】【F:src/app/ticket/[id]/page.tsx†L1-L12}

## Internationalisation
The `LanguageProvider` persists the visitor’s language preference in `localStorage` and exposes it through a React context. Use `useLanguage()` to access or change the current language inside client components. Translations for UI strings live in `src/translations.ts` and `src/i18n.ts`.
【F:src/components/common/LanguageProvider.tsx†L1-L63】【F:src/i18n.ts†L1-L33}

To add a new locale:
1. Extend the `SUPPORTED_LANGS` array and translation dictionaries.
2. Provide locale-specific copy in the relevant translation files.
3. Update components to handle the new language where conditional logic exists.

## Troubleshooting
- **No routes returned:** Confirm the backend URL is reachable and that `/search/departures` returns data for the selected language and seat count.【F:src/components/hero/SearchForm.tsx†L81-L100】
- **Seat map empty:** Ensure the selected tour ID and stops are valid and that the `/seat` endpoint responds with seat metadata.【F:src/components/SeatClient.tsx†L45-L83】
- **Ticket download fails:** The PDF generator relies on valid ticket metadata; verify the booking response includes passenger, route, and baggage fields.【F:src/components/search/SearchResults.tsx†L441-L666】

For additional debugging, start the app with `NEXT_DEBUG=1` or inspect network requests from the browser developer tools.
