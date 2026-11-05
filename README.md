# SE Store · Shahzad Electronics

A multi-page React/Vite store with a Node API and MongoDB. Preserves the existing Shahzad Electronics branding, cream/charcoal/gold palette, product photography, contact number, and delivery policy.

## Store pages

- `/` — storefront home with featured products and collections.
- `/shop` — searchable catalog with category, availability, and sorting filters stored in the URL.
- `/collections` — power, electrical, networking, security, accessories, and bundles.
- `/products/:id` — individual product pages with photo galleries, quantities, compatibility and delivery details.
- `/cart` — shopping bag, quantity controls, delivery progress and totals.
- `/checkout` — delivery details and order submission.
- `/order-confirmation` — receipt and next steps; refresh retains the current tab’s receipt without storing customer contact/address details in browser storage.
- `/about` and `/contact` — store information, contact options and ordering/compatibility FAQs.
- `/admin` — protected product and order management.

All pages support direct links and refresh. Store navigation uses browser history, preserving the bag and checkout form while moving between pages. Collections without listed products offer a WhatsApp enquiry.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` for the store and `http://localhost:5173/admin` for administration. The same server runs the API and Vite, so no second process or proxy configuration is needed. `PORT` and `HOST` are optional environment settings.

The existing `.env` supplies `MONGODB_URI`. Private `ADMIN_EMAIL` and a generated `ADMIN_PASSWORD` have been added locally; use those values to sign in. They are never included in the browser bundle or committed to Git. Restart the server after changing them. Changing either credential invalidates existing sessions.

For a fresh checkout, copy `.env.example` to `.env`, supply a MongoDB URI and admin email, and choose a unique password of at least 12 characters. Keep `.env` private.

## Store and administration

- Customers can search, filter, sort, view product details, manage a persistent shopping bag, and submit their delivery details.
- Checkout saves an order and reserves stock atomically. Prices and delivery are calculated on the server. Repeated submissions with the same checkout key return the existing receipt.
- The receipt includes an optional WhatsApp follow-up. Payment is arranged after store confirmation; there is no online payment gateway.
- Admin can add/edit products, set prices and stock, manage image URLs, and archive products by disabling **Visible in the store**. Archived products remain in historical orders.
- Orders can be searched by reference, customer, phone or city, filtered by status, and updated to new/confirmed/shipped/completed/cancelled. Cancellation restores stock once; cancelled and completed orders cannot be reopened.
- Admin sessions last eight hours in HTTP-only cookies. Login attempts are rate limited; customer information is available only to signed-in admins. Overview and order lists cover the most recent 500 orders.

Delivery is **Rs. 250**, becoming free when the merchandise subtotal is **greater than Rs. 5,000**. Orders are denominated in PKR. WhatsApp remains `0318 7083785`.

The original three products are inserted into the `se_store` database on first connection, with **25 starter units each**. Review and replace these starter stock quantities before accepting real orders. Existing products are never overwritten by initialization. Add electrical items such as lights, switches, sockets and cables through the admin panel; categories are created from the product category field. Collections without listed stock remain WhatsApp enquiries.

MongoDB Atlas or another replica set is required for checkout/cancellation transactions. `MONGODB_DB` optionally changes the database name. The server creates product/order indexes and TTL indexes for sessions and login throttling.

## Images

Place images in `public/images` and enter `/images/filename.png` in the product editor, or use an HTTPS image URL. A neutral placeholder is shown for missing images. Remote image files must be publicly accessible. The editor supports URLs, not file uploads.

## Checks

```bash
npm test
npm run build
```

The database integration test is opt-in:

```bash
SE_STORE_INTEGRATION=1 npm test
```

It uses a randomly named `se_store_test_*` database, verifies authentication, product editing, checkout, idempotency, stock, cancellation and logout, then drops only that temporary database. It requires the `.env` credentials and MongoDB permissions to create/drop the temporary database. Normal tests run domain validation without connecting to MongoDB.

## Production

```bash
npm run build
npm start
```

`npm start` serves `dist` and the API on port 5173 (or `PORT`). Serve it behind HTTPS in production; production admin cookies require HTTPS. `npm run preview` is Vite's static-only build preview and does not run the API.

For Vercel, use the Vite preset, `npm run build`, and output directory `dist`. The `api/[...route].js` function handles the API and `vercel.json` handles frontend navigation. Configure `MONGODB_URI`, optional `MONGODB_DB`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as server environment variables. Configure Atlas network access for the deployment. Never prefix private settings with `VITE_`.
