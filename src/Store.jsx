import React, { useEffect } from 'react'
import { useRoute } from './router'
import { useStore } from './useStore'
import { MissingPage, StoreLayout } from './store-components'
import {
  AboutPage,
  ContactPage,
  HomePage,
  ProductPage,
  ShopPage,
} from './StorePages'
import { CartPage, CheckoutPage, ConfirmationPage } from './PurchasePages'
import './storefront.css'

export default function Store() {
  const { url, navigate } = useRoute()
  const store = useStore()
  const path = url.pathname.replace(/\/$/, '') || '/'
  useEffect(() => {
    if (path === '/collections')
      navigate(`/shop${url.search}`, { replace: true })
  }, [path, url.search, navigate])
  const productMatch = path.match(/^\/products\/([a-zA-Z0-9-]+)$/)
  useEffect(() => {
    const titles = {
      '/': 'Everyday Electrical & Electronic Essentials',
      '/shop': 'Shop All Products',
      '/about': 'Our Story',
      '/contact': 'Contact & Help',
      '/cart': 'Your Shopping Bag',
      '/checkout': 'Checkout',
      '/order-confirmation': 'Thank You for Your Order',
    }
    document.title = `${productMatch ? store.products.find((p) => p.id === productMatch[1])?.name || 'Product' : titles[path] || 'Page Not Found'} — Shahzad Electronics`
  }, [path, store.products])
  let page
  if (path === '/') page = <HomePage store={store} />
  else if (path === '/shop') page = <ShopPage store={store} />
  else if (path === '/collections') page = <ShopPage store={store} />
  else if (path === '/about') page = <AboutPage />
  else if (path === '/contact') page = <ContactPage />
  else if (path === '/cart') page = <CartPage store={store} />
  else if (path === '/checkout') page = <CheckoutPage store={store} />
  else if (path === '/order-confirmation')
    page = <ConfirmationPage store={store} />
  else if (productMatch)
    page = <ProductPage store={store} id={productMatch[1]} />
  else page = <MissingPage />
  return <StoreLayout store={store}>{page}</StoreLayout>
}
