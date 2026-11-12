# Kindred — implementation plan

## Product scope
Kindred is a production-oriented, AI-assisted gifting marketplace: an editorial storefront, a secure AI Gift Finder, independent-maker product discovery, collections, product detail views, saved gifts, authentication, and a staged path to makers, orders, checkout, and admin operations. The existing visual identity and working storefront stay intact while server-backed capabilities are added incrementally.

## Implementation approach
- Build a responsive Vite + React + TypeScript single-page app with a small Express server that owns secure AI and Stripe requests and serves the built SPA in production. Routes include `/`, `/gift-finder`, `/discover`, `/product/:id`, `/saved`, `/cart`, `/orders`, and `/sign-in`.
- Use a typed local catalog as the preview-safe source of product data, with a Supabase client adapter that automatically enables Supabase Auth and saved-gift persistence when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are available.
- The AI Gift Finder posts buyer answers to `/api/gift-finder`; the server calls the supported `gpt-6-luna` model with strict JSON schema grounding against the candidate catalog and returns a clearly labeled deterministic fallback when server AI credentials are absent or fail.
- Keep the UI functional in preview without Supabase credentials: browsing, search, filters, product details, local guest saves, and the fallback Gift Finder all work, while auth/persistence shows a clear configuration state.
- Include `public/manus-routes.json`, metadata, app configuration, and an `.env.example` with the required Supabase variables.

## Staged production roadmap
1. **Foundation and AI concierge:** completed storefront, server layer, guided Gift Finder, conversational Gift Assistant, AI support widget, grounded fallback behavior, and deployment contract.
2. **Currency and catalog presentation:** completed live USD→INR rate endpoint with hourly cache/fallback, consistent INR formatting in storefront/cart/finder, INR Stripe Checkout amounts, explicit Supabase `price_usd`/`price_inr` fields, an affordable writing gift for under-₹2,000 requests, a responsive occasion-led discovery band adapted from the latest reference, and a 105-item catalog with 96 additional low-price products across 12 categories using verified, title-aware image assets. The next pass can replace generated catalog records with richer Supabase-backed inventory rows.
3. **Welcome experience:** added a session-gated GiftGenie intro overlay that preserves the existing Kindred application underneath, includes a CSS-rendered premium gift box and reduced-motion-safe animations, reveals the site in place after ENTER GIFTGENIE, and can be replayed from the footer.
4. **Welcome sound and commerce cues:** added a browser-safe, user-initiated Web Audio opening chime with a visible sound toggle, plus ecommerce-style product badges and descriptive image alt text for the expanded catalog.
5. **Social proof on cards:** added star-rating and review-count badges on product imagery and in product metadata, grounded in each product’s existing `rating` and `reviewCount` fields.
3. **Commerce foundation:** completed local persistent gift bag, quantity controls, real Stripe test-mode Checkout Session handoff, raw-body webhook signature verification, and a truthful post-checkout return state. Order fulfillment is deliberately not marked paid until the Supabase webhook worker is connected.
4. **Supabase marketplace data:** move catalog records to products/makers/collections tables, add RLS, persistent wishlist/cart/order records, and maker profiles.
5. **Commerce completion:** connect Stripe webhook events to durable order records, inventory checks, order confirmation/history, and delivery status.
6. **Operations:** maker studio, product submission/approval, admin dashboard, customer management, analytics, contact/support, and role-based authorization.

## Project structure
- `src/main.tsx`: app entry and route mounting.
- `src/App.tsx`: app shell, routes, state, and Supabase-aware actions.
- `src/data/catalog.ts`: product, collection, and maker seed content.
- `src/lib/supabase.ts`: optional Supabase client and auth/persistence helpers.
- `server/index.mjs`: Express server, health check, AI Gift Finder endpoint, Stripe Checkout/webhook routes, and production SPA serving.
- `server/candidates.mjs`: server-side candidate catalog and explicit fallback recommender.
- `Dockerfile`: reproducible server deployment contract.
- `src/styles.css`: design system, responsive layout, motion, and component styling.
- `public/manus-routes.json`: route manifest for the platform.
- `app.config.ts`: platform logo metadata.

## Design direction

### Alternative styles considered
1. Botanical editorial / slow-commerce journal — 0.06
2. Gallery-like monochrome gift studio — 0.03
3. Playful confetti marketplace — 0.02

### Chosen movement
**Botanical editorial / slow-commerce journal**: a calm, tactile, magazine-like storefront with generous whitespace, small maker notes, and warm paper tones.

### Core principles
- Lead with feeling and context, not inventory density.
- Make every product feel hand-picked through maker stories and small details.
- Keep discovery light: prominent search, gentle filters, and opinionated collections.
- Use high-contrast typography and soft surfaces so the experience is premium but accessible.

### Color philosophy
Warm ivory and oat create the feeling of a personal note; ink and forest provide confidence and readability; marigold is Kindred's own spark for saved and featured moments; lilac and sage appear as quiet category accents.

### Layout paradigm
Asymmetrical editorial compositions: a large hero statement paired with a tactile feature card, then horizontal maker/story bands and offset product rows rather than a generic centered card grid.

### Signature elements
- A small four-petal Kindred mark used as a “thoughtful detail” motif.
- Product cards with maker metadata, provenance, and quiet save controls.
- Handwritten-feeling microcopy paired with crisp serif headlines.

### Interaction philosophy and animation
Interactions should feel like turning a page: 150–220ms lift/fade transitions, gentle card elevation on hover, soft save-button pulse, and no distracting auto-rotating content. Respect reduced-motion preferences.

### Typography system
Use `Playfair Display` for emotional headlines and `DM Sans` for UI/body. Headlines are large and tightly tracked; body copy remains 15–17px with generous line-height; labels use uppercase 11px tracking.

### Brand essence
**Kindred helps you give a little more meaning, with less scrolling.** Personality: warm, discerning, human.

### Brand voice
Headlines sound like a thoughtful friend: “Find the one that feels like them.” CTAs are clear but personal: “See thoughtful gifts” and “Save this for later.” Avoid marketplace clichés and urgency language.

### Wordmark and logo
Use a custom inline mark: two offset leaf-like loops forming a soft four-petal shape, paired with the Kindred wordmark in the display serif.

### Signature brand color
Marigold `#DFA63A` — a small spark of delight used for saved items, featured badges, and moments of emphasis.
