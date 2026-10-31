# Shahzad Electronics — multi-product store

A client-side React/Vite storefront for Shahzad Electronics in Phool Nagar. It includes a searchable catalog, category filters, persistent multi-item cart, quantity controls, enquiry collections, and a pre-filled WhatsApp checkout to `0318 7083785`; no customer information is stored.

Product price is `Rs. 2,000` with a `Rs. 250` delivery charge. Delivery becomes free when the product subtotal exceeds `Rs. 5,000`.

## Managing products

Edit `src/catalog.js` to add products, prices, categories, descriptions, and image paths. Orderable products belong in `products`; unpriced WhatsApp enquiry collections belong in `enquiryCollections`.

## Local development

```bash
npm install
npm run dev
```

## Vercel deployment

Import this repository in Vercel. The framework preset should be detected as Vite. The build command is `npm run build` and the output directory is `dist`.
