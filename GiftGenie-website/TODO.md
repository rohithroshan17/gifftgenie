# TODO — Kindred gifting marketplace

- [x] **Add a secure AI Gift Finder as the highest-priority new feature.** The app must ask who the gift is for, relationship, occasion, budget, interests/hobbies, personality, and special preferences; send those answers to a server-side AI endpoint; return grounded recommendations with product image, name, price, why it fits, personalised explanation, wishlist action, and product detail action; and allow users to refine answers and generate new suggestions. If AI credentials are unavailable, the UI must clearly label the working fallback instead of pretending AI is connected.

- [x] **Add the server layer required for protected AI calls.** Keep AI credentials off the frontend, expose a health endpoint, validate request size, ground model output to known candidate product IDs with strict JSON schema, and serve the SPA in production through a container contract.

- [x] **Create a warm, editorial gifting homepage inspired by the reference site.** The home route must communicate thoughtful gifting, independent makers, and personal discovery with premium responsive typography, a hero, featured products, collections, maker story content, and clear calls to action.

- [x] **Add functional discovery and product browsing.** Visitors must be able to search products, filter by collection/category, browse a discover route, open product detail views, and see maker, price, rating, location, and description information.

- [x] **Add saved gifts and guest-safe behavior.** Visitors must be able to save products from cards and detail views; guests must receive a clear sign-in prompt or local fallback, while authenticated users can persist saved gifts through Supabase.

- [x] **Add a dedicated sign-in/sign-up page.** The sign page must support email/password sign in and account creation through Supabase Auth when configured, include validation and clear loading/error/success states, and explain why signing in helps.

- [ ] **Finish live Supabase persistence setup.** The frontend wiring, browser-safe environment declarations, offline preview fallback, `.env.example`, and SQL note are delivered; the target Supabase project still needs valid URL/key values and the included `saved_gifts` schema applied before live auth and remote saves can be verified.

- [x] **Deliver complete route and platform metadata.** Keep `public/manus-routes.json`, metadata, app config, and the configured runtime/build commands aligned with the implemented routes.

- [x] **Add a functional gift bag and real payment handoff.** Visitors can add products from detail pages, persist the bag locally, change quantities, remove items, enter a receipt email, and open a real Stripe test-mode Checkout Session. The server verifies raw Stripe webhook signatures and the UI explicitly distinguishes a Stripe return from webhook-confirmed payment.

- [x] **Convert shopper-facing pricing to INR correctly.** Preserve USD source prices, fetch a live USD→INR rate server-side with an hourly cache and transparent fallback, format prices with Indian grouping (for example `₹1,503`), use INR in cart totals and finder budgets, and create Stripe Checkout line items in INR paise rather than merely changing the currency symbol.

- [x] **Add conversational AI experiences.** The new `/gift-assistant` route accepts natural-language requests such as birthday gifts under `₹2,000`, understands INR budgets and Indian occasions, supports follow-up refinement, returns grounded product recommendations, and clearly labels setup fallbacks. A floating support assistant answers product, shipping, returns, navigation, and authenticated-order guidance without inventing order details.

- [x] **Preserve and extend premium visual presentation.** Keep the existing editorial hero, collection, maker, and product imagery; add the conversational assistant’s responsive layout, hover/transition styling, INR-friendly product coverage, and an affordable writing-gift image that prevents common under-budget queries from returning empty results.

- [x] **Add product image galleries and previews.** Product detail pages now support multiple responsive gallery images with active thumbnail controls, preserve the original product hero image, and fall back cleanly to a single image for products without a gallery.

- [x] **Adapt the latest reference’s occasion-led discovery pattern.** Preserve Kindred’s botanical editorial identity while adding responsive Birthdays, Anniversaries, Housewarming, and Thank-you cards with working links into the discovery experience and verified image assets.

- [x] **Expand the affordable catalog beyond 100 items.** Add 96 generated low-price products across 12 gift categories, each with a distinct product record, maker metadata, INR-converted price, tags, description, and image assignment; expose the categories in discovery filters and ground the server AI candidate catalog with the same 105-item inventory.

- [x] **Match expanded product imagery to the product title.** Replace the generic image rotation with title rules for flowers, candles, tea/chocolate, stationery, jewellery, fashion, and gadgets, plus category-specific fallbacks for every other low-price item.

- [x] **Add a premium first-visit GiftGenie welcome layer without replacing the existing site.** Show the requested GiftGenie brand, tagline, headline, supporting copy, warm cream/plum/gold palette, CSS 3D gift box, particles, glow, fade/float animation, reduced-motion behavior, accessible enter button, session-only gating, in-place reveal, and footer replay control while preserving all existing routes, products, collections, auth, cart, AI, and Supabase behavior.

- [x] **Add user-initiated opening sound and ecommerce signals.** The welcome screen now has a default-on sound toggle and a lightweight Web Audio three-note opening cue that plays only after ENTER GIFTGENIE is clicked; product cards now add relevant low-price, personalized, birthday, and loved-by-gifters badges plus descriptive image alt text.

- [x] **Add visible user reviews and star-rating badges.** Product cards now show an image-overlay badge with the product’s star rating and review count, expose accessible review text, and repeat the review count beside the INR price without changing save, open, or cart interactions.

- [ ] **Move catalog and marketplace records into Supabase.** Products must become genuine database records with makers, collections, categories, inventory, product images, validation, relationships, and Row Level Security; preserve current preview fallback until live records are seeded.

- [ ] **Complete durable commerce and operations.** Add inventory/availability checks, Supabase order and fulfillment records driven by verified Stripe events, shipping and order confirmation, order history/tracking, maker registration/profile/product/inventory/order management, admin approval, customer management, analytics, contact/support, and role-based permissions. Never simulate payment success or expose private credentials.
