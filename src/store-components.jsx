import React, { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Headphones,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { Brand, EmptyState, ProductMedia } from './components'
import { money, whatsapp } from './api'
import { Link, useRoute } from './router'

export const productUrl = (product) =>
  `/products/${encodeURIComponent(product.id)}`
export const shopCategory = (category) =>
  `/shop?category=${encodeURIComponent(category)}`
export function StoreLayout({ store, children }) {
  const { url, navigate } = useRoute()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const categories = [
    ...new Set(store.products.map((product) => product.category)),
  ]
  useEffect(() => setMenuOpen(false), [url.pathname, url.search])
  const nav = [
    { href: '/', name: 'Home' },
    { href: '/shop', name: 'Shop all' },
    { href: '/about', name: 'Our story' },
    { href: '/contact', name: 'Contact' },
  ]
  return (
    <div className="sf-shell">
      <a className="sf-skip" href="#store-main">
        Skip to content
      </a>
      <div className="sf-announcement">
        <div className="sf-container">
          <span>
            <Truck size={14} /> Free delivery on orders over Rs. 5,000
          </span>
          <span>
            Made for your everyday.{' '}
            <Link href="/shop">
              Find your essential <ArrowRight size={12} />
            </Link>
          </span>
          <a href={whatsapp} target="_blank" rel="noreferrer">
            Need a hand? Let’s talk <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
      <header className="sf-header">
        <div className="sf-container sf-header-main">
          <Brand />
          <form
            className="sf-header-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              navigate(
                `/shop${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`,
              )
            }}
          >
            <Search size={18} />
            <input
              aria-label="Search the store"
              placeholder="Search for your next essential…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" aria-label="Submit search">
              <ArrowRight size={18} />
            </button>
          </form>
          <a
            className="sf-header-help"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <Headphones size={21} />
            <span>
              Let’s find the right fit<strong>0318 7083785</strong>
            </span>
          </a>
          <Link
            className="sf-bag"
            href="/cart"
            aria-label={`Shopping bag, ${store.count} items`}
          >
            <ShoppingBag size={21} />
            <span>
              Bag <b>{store.count}</b>
            </span>
          </Link>
          <button
            className="sf-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="store-navigation"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        <div className={`sf-nav-wrap ${menuOpen ? 'is-open' : ''}`}>
          <div className="sf-container sf-nav-inner">
            <nav id="store-navigation" aria-label="Main navigation">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    url.pathname === item.href ||
                    (item.href === '/shop' &&
                      url.pathname.startsWith('/products/'))
                      ? 'active'
                      : ''
                  }
                  aria-current={url.pathname === item.href ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <span>
              <MapPin size={13} /> Your local store in Phool Nagar
            </span>
          </div>
        </div>
      </header>
      <main id="store-main" tabIndex={-1}>
        {children}
      </main>
      <section className="sf-service-strip">
        <div className="sf-container">
          <div>
            <Truck />
            <span>
              <strong>Delivered to your door</strong>
              <small>Rs. 250 delivery · free over Rs. 5,000</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>A real store, a real conversation</strong>
              <small>Shahzad Electronics, Phool Nagar</small>
            </span>
          </div>
          <div>
            <MessageCircle />
            <span>
              <strong>Good advice comes standard</strong>
              <small>Ask us about your device on WhatsApp</small>
            </span>
          </div>
        </div>
      </section>
      <footer className="sf-footer">
        <div className="sf-container sf-footer-grid">
          <div>
            <Brand />
            <p>
              Practical electronics. Personal service.
              <br />A little power for your everyday.
            </p>
            <span className="sf-footer-location">
              <MapPin size={14} /> Phool Nagar, Punjab, Pakistan
            </span>
          </div>
          <div>
            <h3>The store</h3>
            <Link href="/shop">Shop all products</Link>
            {categories.slice(0, 3).map((category) => (
              <Link key={category} href={shopCategory(category)}>
                {category}
              </Link>
            ))}
          </div>
          <div>
            <h3>Here to help</h3>
            <Link href="/contact">Contact us</Link>
            <Link href="/contact#delivery">Delivery & ordering</Link>
            <Link href="/contact#compatibility">Compatibility help</Link>
            <Link href="/about">Our story</Link>
          </div>
          <div className="sf-footer-contact">
            <h3>Let’s talk.</h3>
            <p>
              A question, a device model, a photo.
              <br />
              We’re a message away.
            </p>
            <a href={whatsapp} target="_blank" rel="noreferrer">
              0318 7083785 <ArrowUpRight size={17} />
            </a>
            <small>Call or WhatsApp</small>
          </div>
        </div>
        <div className="sf-container sf-footer-bottom">
          <span>© {new Date().getFullYear()} Shahzad Electronics.</span>
          <span>Simple things. Better connected.</span>
          <a href="/admin">
            Store admin <ArrowUpRight size={12} />
          </a>
        </div>
      </footer>
      <nav className="sf-mobile-nav" aria-label="Quick navigation">
        <Link href="/" aria-current={url.pathname === '/' ? 'page' : undefined}>
          <Home size={19} />
          <span>Home</span>
        </Link>
        <Link
          href="/shop"
          aria-current={
            url.pathname === '/shop' || url.pathname.startsWith('/products/')
              ? 'page'
              : undefined
          }
        >
          <Package size={19} />
          <span>Shop</span>
        </Link>
        <Link
          href="/cart"
          aria-current={
            ['/cart', '/checkout', '/order-confirmation'].includes(url.pathname)
              ? 'page'
              : undefined
          }
        >
          <span className="sf-mobile-bag">
            <ShoppingBag size={19} />
            {store.count > 0 && <b>{store.count}</b>}
          </span>
          <span>Bag</span>
        </Link>
        <Link
          href="/contact"
          aria-current={url.pathname === '/contact' ? 'page' : undefined}
        >
          <MessageCircle size={19} />
          <span>Help</span>
        </Link>
      </nav>
      {store.toast && (
        <div className="sf-toast" role="status">
          <CheckCircle2 size={19} />
          <span>{store.toast}</span>
          <Link href="/cart" onClick={() => store.setToast('')}>
            View bag <ArrowRight size={14} />
          </Link>
          <button
            onClick={() => store.setToast('')}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

export function Breadcrumb({ items }) {
  return (
    <nav className="sf-breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} />
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
export function PageIntro({ eyebrow, title, children }) {
  return (
    <div className="sf-page-intro">
      <p className="sf-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  )
}
export function SectionHeading({ eyebrow, title, href, link = 'Explore all' }) {
  return (
    <div className="sf-section-heading">
      <div>
        <p className="sf-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="sf-text-link" href={href}>
          {link}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}
export function ProductCard({ product, onAdd }) {
  return (
    <article className="sf-product-card">
      <Link
        className="sf-product-photo"
        href={productUrl(product)}
        aria-label={`View ${product.name}`}
      >
        <ProductMedia product={product} />
        {(product.badge || !product.stock) && (
          <span className="sf-badge">
            {product.stock ? product.badge : 'Sold out'}
          </span>
        )}
        <span className="sf-product-view">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <div className="sf-product-copy">
        <Link
          className="sf-product-category"
          href={shopCategory(product.category)}
        >
          {product.category}
        </Link>
        <Link href={productUrl(product)}>
          <h3>{product.name}</h3>
        </Link>
        <p>{product.description}</p>
        <div>
          <strong>{money(product.price)}</strong>
          <button
            onClick={() => onAdd(product)}
            disabled={!product.stock}
            aria-label={`Add ${product.name} to bag`}
          >
            <span>{product.stock ? 'Add' : 'Sold out'}</span>
            <Plus size={17} />
          </button>
        </div>
      </div>
    </article>
  )
}
export function ProductGrid({ products, store }) {
  if (store.loading && !store.products.length)
    return (
      <div
        className="sf-product-grid"
        aria-busy="true"
        aria-label="Loading products"
      >
        {[1, 2, 3].map((i) => (
          <div className="sf-skeleton" key={i}>
            <div />
            <span />
            <span />
          </div>
        ))}
      </div>
    )
  if (store.error)
    return (
      <EmptyState icon={Package} title="We couldn’t load the products.">
        <p>{store.error}</p>
        <button className="sf-button sf-button-outline" onClick={store.refresh}>
          Try again <ArrowRight size={16} />
        </button>
      </EmptyState>
    )
  return (
    <div className="sf-product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={store.add} />
      ))}
    </div>
  )
}
export function Quantity({
  value,
  max,
  onChange,
  name = 'item',
  disabled = false,
}) {
  return (
    <div className="sf-quantity">
      <button
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        type="button"
        aria-label={`Decrease ${name} quantity`}
      >
        <Minus size={15} />
      </button>
      <span>{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        type="button"
        aria-label={`Increase ${name} quantity`}
      >
        <Plus size={15} />
      </button>
    </div>
  )
}
export function CartLines({ store, compact = false }) {
  return (
    <div className={`sf-cart-lines ${compact ? 'compact' : ''}`}>
      {store.lines.map(({ id, quantity, product }) => (
        <div className="sf-cart-item" key={id}>
          {product ? (
            <Link className="sf-cart-image" href={productUrl(product)}>
              <ProductMedia product={product} />
            </Link>
          ) : (
            <span className="sf-cart-image sf-missing">
              <Package />
            </span>
          )}
          <div className="sf-cart-copy">
            {product ? (
              <>
                <Link
                  className="sf-product-category"
                  href={shopCategory(product.category)}
                >
                  {product.category}
                </Link>
                <Link href={productUrl(product)}>
                  <h3>{product.name}</h3>
                </Link>
                <span>
                  {money(product.price)} {compact && `× ${quantity}`}
                </span>
              </>
            ) : (
              <h3>Unavailable product</h3>
            )}
            {!compact && (
              <>
                <Quantity
                  value={quantity}
                  max={Math.min(99, product?.stock || 0)}
                  name={product?.name}
                  disabled={store.submitting}
                  onChange={(next) => store.updateCart(id, next)}
                />
                {(!product || quantity > product.stock) && (
                  <p className="sf-field-error">
                    {product
                      ? `Only ${product.stock} available. Reduce the quantity or remove this item.`
                      : 'This item is no longer available. Please remove it.'}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="sf-cart-item-end">
            <strong>{product ? money(product.price * quantity) : '—'}</strong>
            {!compact && (
              <button
                disabled={store.submitting}
                onClick={() => store.updateCart(id, 0)}
                aria-label={`Remove ${product?.name || 'unavailable item'}`}
              >
                <Trash2 size={15} /> Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
export function OrderTotals({ store }) {
  return (
    <div className="sf-totals">
      <div>
        <span>Subtotal</span>
        <strong>{money(store.subtotal)}</strong>
      </div>
      <div>
        <span>Delivery</span>
        <strong>
          {store.delivery ? (
            money(store.delivery)
          ) : (
            <span className="sf-free">On us</span>
          )}
        </strong>
      </div>
      <div className="sf-total">
        <span>
          Total <small>(PKR)</small>
        </span>
        <strong>{money(store.total)}</strong>
      </div>
    </div>
  )
}
export function NeedHelp() {
  return (
    <section className="sf-help">
      <div>
        <Headphones size={32} strokeWidth={1.3} />
        <div>
          <h2>A little help goes a long way.</h2>
          <p>
            Send us your device model or a photo. We’ll help you find the right
            fit.
          </p>
        </div>
      </div>
      <a
        className="sf-button sf-button-dark"
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={18} /> Let’s talk on WhatsApp{' '}
        <ArrowUpRight size={17} />
      </a>
    </section>
  )
}
export function MissingPage({ product = false }) {
  return (
    <div className="sf-container sf-missing-page">
      <PageIntro
        eyebrow={product ? 'PRODUCT UNAVAILABLE' : 'A SMALL DETOUR'}
        title={
          product
            ? 'This essential has left the shelf.'
            : 'Looks like a loose connection.'
        }
      >
        {product
          ? 'This product may have been archived, or the link may have changed.'
          : 'We couldn’t find this page. Let’s get you back to the good things.'}
      </PageIntro>
      <Link className="sf-button sf-button-dark" href="/shop">
        Back to the shop <ArrowRight size={17} />
      </Link>
    </div>
  )
}
