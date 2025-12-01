# Booking flow review

- The referenced `src/components/booking/BookingFlow.tsx` component is missing from the codebase (no matches for `*Booking*Flow*.tsx` under `src`), so the step/state machine described in rules 1–9 is not present to verify.
- The home page renders `HeroSection`, which immediately embeds the search form and shows results when criteria exist; there is no step controller, active-step tracking, or forward navigation lock present in this flow.
- The `/booking` page uses `BookingCard`, which mirrors the same search form → results pattern without any notion of steps, statuses, or reset handling; it similarly lacks the single-active-step constraint and the Passengers/Extras/Contacts exceptions described in the rules.
