import React, { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  ChevronDown,
  Grid2X2,
  Headphones,
  ListFilter,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import { Dialog, EmptyState, ProductMedia } from './components'
import { money, whatsapp } from './api'
import { Link, useRoute } from './router'
import {
  Breadcrumb,
  MissingPage,
  NeedHelp,
  PageIntro,
  ProductGrid,
  productUrl,
  Quantity,
  SectionHeading,
  shopCategory,
} from './store-components'

export function HomePage({ store }) {
  const featured =
    store.products.find((p) => p.id === 'router-power-bank-12v') ||
    store.products[0]
  return (
    <>
      <section className="sf-home-hero sf-container">
        <div className="sf-hero-copy">
          <p className="sf-eyebrow">
            <span /> ELECTRONICS MADE SIMPLE
          </p>
          <h1>
            Everyday.
            <br />
            Powered <em>better.</em>
          </h1>
          <p>
            Practical electronics, clear prices, and personal service from Phool
            Nagar.
          </p>
          <div className="sf-hero-actions">
            <Link className="sf-button sf-button-dark" href="/shop">
              Shop all products <ArrowRight size={18} />
            </Link>
            <Link className="sf-text-link" href="/about">
              Meet your local store <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="sf-hero-display">
          <div className="sf-hero-photo">
            <span className="sf-photo-label">
              <span /> THE POWER & BACKUP EDIT
            </span>
            <img
              src="/images/router-power-bank-hero.png"
              alt="A white router power bank, ready to keep your Wi-Fi connected"
            />
          </div>
          <div className="sf-hero-product">
            <div>
              <span>SMALL DEVICE. BIG RELIEF.</span>
              <Link href={featured ? productUrl(featured) : '/shop'}>
                <h2>Keep the connection going.</h2>
              </Link>
              <p>
                {featured
                  ? `${featured.name} · ${money(featured.price)}`
                  : 'Explore power & backup essentials'}
              </p>
            </div>
            <Link
              href={featured ? productUrl(featured) : '/shop'}
              aria-label="Explore the router power bank"
            >
              <ArrowUpRight size={24} />
            </Link>
          </div>
        </div>
      </section>
      <section className="sf-section sf-container sf-home-products">
        <SectionHeading
          eyebrow="PRACTICAL PICKS"
          title="Shop everyday essentials."
          href="/shop"
          link="Shop all products"
        />
        <ProductGrid products={store.products.slice(0, 3)} store={store} />
        {!store.loading && !store.error && !store.products.length && (
          <EmptyState icon={Package} title="Good things are on the way.">
            <p>Ask us on WhatsApp about the item you’re looking for.</p>
          </EmptyState>
        )}
      </section>
      <div className="sf-container sf-help-section">
        <NeedHelp />
      </div>
    </>
  )
}

export function ShopPage({ store }) {
  const { url, navigate } = useRoute()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = url.searchParams.get('q') || ''
  const category = url.searchParams.get('category') || ''
  const sort = url.searchParams.get('sort') || 'featured'
  const inStock = url.searchParams.get('stock') === 'available'
  const categories = [...new Set(store.products.map((p) => p.category))]
  const filtered = store.products
    .filter(
      (p) =>
        (!category || p.category === category) &&
        (!inStock || p.stock > 0) &&
        `${p.name} ${p.description} ${p.category}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
    )
    .sort((a, b) =>
      sort === 'low'
        ? a.price - b.price
        : sort === 'high'
          ? b.price - a.price
          : sort === 'name'
            ? a.name.localeCompare(b.name)
            : 0,
    )
  function filter(key, value) {
    const params = new URLSearchParams(url.search)
    if (value) params.set(key, value)
    else params.delete(key)
    navigate(`/shop${params.size ? `?${params}` : ''}`, {
      replace: key === 'q',
    })
  }
  return (
    <div className="sf-container">
      <Breadcrumb items={[{ label: 'Shop all' }]} />
      <PageIntro
        eyebrow="THE SHAHZAD ELECTRONICS STORE"
        title={category || 'Your everyday starts here.'}
      >
        Practical products. Straightforward prices. Find the right connection.
      </PageIntro>
      <div className="sf-shop-layout">
        <aside className={`sf-shop-sidebar ${filtersOpen ? 'is-open' : ''}`}>
          <div className="sf-sidebar-title">
            <h2>Browse the shelves</h2>
            <button
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="sf-shop-categories">
            <button
              onClick={() => {
                filter('category', '')
                setFiltersOpen(false)
              }}
              className={!category ? 'active' : ''}
            >
              All products <span>{store.products.length}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={category === c ? 'active' : ''}
                onClick={() => {
                  filter('category', c)
                  setFiltersOpen(false)
                }}
              >
                {c}
                <span>
                  {store.products.filter((p) => p.category === c).length ||
                    'Enquire'}
                </span>
              </button>
            ))}
          </div>
          <div className="sf-availability-filter">
            <h3>Availability</h3>
            <label>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) =>
                  filter('stock', e.target.checked ? 'available' : '')
                }
              />{' '}
              In stock only
            </label>
          </div>
          <div className="sf-sidebar-help">
            <Headphones size={25} strokeWidth={1.3} />
            <h3>Can’t find your fit?</h3>
            <p>Tell us what you need. We’ll help you find it.</p>
            <Link href="/contact">
              Let’s talk <ArrowUpRight size={15} />
            </Link>
          </div>
        </aside>
        <section className="sf-shop-results" aria-label="Products">
          <div className="sf-shop-toolbar">
            <label className="sf-search">
              <Search size={18} />
              <input
                aria-label="Search products"
                value={query}
                onChange={(e) => filter('q', e.target.value)}
                placeholder="Search the shelves…"
              />
              {query && (
                <button
                  aria-label="Clear search"
                  onClick={() => filter('q', '')}
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <label className="sf-sort">
              <span className="sr-only">Sort products</span>
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => filter('sort', e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
          <div className="sf-results-meta">
            <span>
              {store.loading
                ? 'Checking the shelves…'
                : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}`}
            </span>
            <button
              className="sf-filter-toggle"
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
            >
              <ListFilter size={16} /> Filters
            </button>
            {(query || category || inStock) && (
              <button onClick={() => navigate('/shop')}>
                Clear filters <X size={13} />
              </button>
            )}
            <Grid2X2 size={15} />
          </div>
          {category && (
            <div className="sf-active-filter">
              {category}
              <button
                onClick={() => filter('category', '')}
                aria-label="Remove category filter"
              >
                <X size={13} />
              </button>
            </div>
          )}
          <ProductGrid products={filtered} store={store} />
          {!store.loading && !store.error && !filtered.length && (
            <EmptyState icon={Search} title="Let’s help you find it.">
              <p>
                {category
                  ? `We’re not listing ${category.toLowerCase()} products online just yet. Ask us for available options and prices.`
                  : 'Try another search, or send us the name or a photo of the item you need.'}
              </p>
              <div className="sf-empty-actions">
                <button
                  className="sf-button sf-button-outline"
                  onClick={() => navigate('/shop')}
                >
                  Browse all
                </button>
                <a
                  className="sf-button sf-button-dark"
                  href={`${whatsapp}?text=${encodeURIComponent(`Hello! I’m looking for ${query || category || 'an electronic item'}. Please share available options and prices.`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ask on WhatsApp <ArrowUpRight size={16} />
                </a>
              </div>
            </EmptyState>
          )}
        </section>
      </div>
      <div className="sf-help-section">
        <NeedHelp />
      </div>
    </div>
  )
}

export function ProductPage({ store, id }) {
  const { navigate } = useRoute()
  const product = store.products.find((p) => p.id === id)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState('')
  const [zoom, setZoom] = useState(false)
  useEffect(() => {
    setQuantity(1)
    setActiveImage('')
    setZoom(false)
  }, [id])
  if (store.loading && !store.products.length)
    return (
      <div className="sf-container sf-product-loading">
        <ProductGrid products={[]} store={store} />
      </div>
    )
  if (store.error)
    return (
      <div className="sf-container sf-product-loading">
        <ProductGrid products={[]} store={store} />
      </div>
    )
  if (!product) return <MissingPage product />
  const router = product.id.startsWith('router-power-bank')
  const images = [
    ...new Set([
      product.image,
      ...(router
        ? [
            '/images/router-power-bank-hero.png',
            '/images/router-power-bank-controls-pro.png',
            '/images/router-power-bank-in-use.png',
          ]
        : []),
    ]),
  ].filter(Boolean)
  const image = activeImage || images[0] || ''
  const related = store.products.filter((p) => p.id !== id).slice(0, 3)
  return (
    <div className="sf-container">
      <Breadcrumb
        items={[
          { label: 'Shop', href: '/shop' },
          { label: product.category, href: shopCategory(product.category) },
          { label: product.name },
        ]}
      />
      <div className="sf-pdp">
        <div className="sf-gallery">
          <button
            className="sf-gallery-main"
            onClick={() => image && setZoom(true)}
            aria-label={`Enlarge ${product.name} image`}
            disabled={!image}
          >
            <ProductMedia product={{ ...product, image }} />
            {product.badge && <span className="sf-badge">{product.badge}</span>}
            <span className="sf-gallery-hint">
              A closer look <PlusIcon />
            </span>
          </button>
          {images.length > 1 && (
            <div className="sf-thumbnails">
              {images.map((src, i) => (
                <button
                  key={src}
                  aria-label={`View product photo ${i + 1}`}
                  aria-pressed={image === src}
                  className={image === src ? 'active' : ''}
                  onClick={() => setActiveImage(src)}
                >
                  <img src={src} alt={`${product.name}, view ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="sf-pdp-info">
          <Link className="sf-eyebrow" href={shopCategory(product.category)}>
            {product.category}
          </Link>
          <h1>{product.name}</h1>
          <p className="sf-pdp-description">{product.description}</p>
          <div className="sf-pdp-price">
            <strong>{money(product.price)}</strong>
            <span>
              PKR ·{' '}
              {product.packSize > 1
                ? `Pack of ${product.packSize}`
                : 'Per unit'}
            </span>
          </div>
          <p className={`sf-stock ${!product.stock ? 'out' : ''}`}>
            <span />
            {product.stock
              ? `In stock · ${product.stock} available`
              : 'Currently out of stock'}
          </p>
          {router && (
            <div className="sf-pdp-highlights">
              <span>
                <BatteryCharging size={17} /> Six-cell pack
              </span>
              <span>
                <Zap size={17} /> 12V DC output
              </span>
              <span>
                <Package size={17} /> {product.packSize || 1}{' '}
                {(product.packSize || 1) === 1 ? 'unit' : 'units'}
              </span>
            </div>
          )}
          <div className="sf-purchase-actions">
            <div className="sf-purchase-row">
              <Quantity
                value={quantity}
                max={Math.min(product.stock, 99)}
                onChange={setQuantity}
                name={product.name}
                disabled={!product.stock}
              />
              <button
                className="sf-button sf-button-dark"
                disabled={!product.stock || store.submitting}
                onClick={() => store.add(product, quantity)}
              >
                <ShoppingBag size={18} /> Add to bag <ArrowRight size={17} />
              </button>
            </div>
            <button
              className="sf-button sf-button-outline sf-wide"
              disabled={!product.stock || store.submitting}
              onClick={() => {
                if (store.add(product, quantity)) {
                  store.setToast('')
                  navigate('/checkout')
                }
              }}
            >
              Buy it now <ArrowRight size={17} />
            </button>
          </div>
          <div className="sf-pdp-delivery">
            <Truck size={20} />
            <p>
              <strong>A simple delivery, right to your door.</strong>
              <span>Rs. 250 delivery. Free on orders over Rs. 5,000.</span>
            </p>
          </div>
          <div className="sf-product-accordions">
            <details open>
              <summary>
                Good to know <ChevronDown size={16} />
              </summary>
              <p>
                {router
                  ? 'Designed for compatible 12V routers. Check your adapter voltage, barrel connector size and polarity before connecting. Battery runtime depends on your device and usage.'
                  : 'Need a specific size, connector or model? Send us the details before ordering and we’ll help check the fit.'}
              </p>
            </details>
            <details>
              <summary>
                Delivery & ordering <ChevronDown size={16} />
              </summary>
              <p>
                Your order is saved with the store. We’ll contact you to confirm
                product availability, delivery arrangements and payment details.
                Online payment is not collected at checkout.
              </p>
              <Link href="/contact#delivery">
                More about ordering <ArrowUpRight size={14} />
              </Link>
            </details>
            <details>
              <summary>
                Need a little help? <ChevronDown size={16} />
              </summary>
              <p>
                Send us your device model or a clear photo. We’ll help you find
                the right fit before you order.
              </p>
              <a
                href={`${whatsapp}?text=${encodeURIComponent(`Hello! I have a question about ${product.name}.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ask about this product <ArrowUpRight size={14} />
              </a>
            </details>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="sf-section sf-related">
          <SectionHeading
            eyebrow="KEEP EXPLORING"
            title="A few more good things."
            href="/shop"
            link="Back to the shop"
          />
          <ProductGrid products={related} store={store} />
        </section>
      )}
      {zoom && (
        <Dialog title={product.name} wide onClose={() => setZoom(false)}>
          <img className="sf-zoom-image" src={image} alt={product.name} />
        </Dialog>
      )}
    </div>
  )
}
function PlusIcon() {
  return <span aria-hidden="true">+</span>
}

export function AboutPage() {
  return (
    <div className="sf-container">
      <Breadcrumb items={[{ label: 'Our story' }]} />
      <section className="sf-about-intro">
        <div>
          <p className="sf-eyebrow">SHAHZAD ELECTRONICS · PHOOL NAGAR</p>
          <h1>
            Good products.
            <br />
            Real people.
            <br />
            <em>Better connected.</em>
          </h1>
        </div>
        <div>
          <p>
            Useful electronics don’t have to be complicated. Neither should
            finding the right ones.
          </p>
          <p>
            We’re your neighbourhood electronics store in Phool Nagar, Punjab.
            We help you find practical essentials for your home, your devices
            and your everyday — with clear prices and a real conversation when
            you need one.
          </p>
          <Link className="sf-text-link" href="/contact">
            Come say hello <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <div className="sf-about-image">
        <img
          src="/images/router-power-bank-in-use.png"
          alt="A router and backup power bank, two everyday essentials"
        />
        <div>
          <span>THE LITTLE THINGS MATTER.</span>
          <h2>
            A connection.
            <br />A conversation.
            <br />A little peace of mind.
          </h2>
        </div>
      </div>
      <section className="sf-section">
        <SectionHeading
          eyebrow="THE SE WAY"
          title="Simple things. Done thoughtfully."
        />
        <div className="sf-values">
          <article>
            <span>01</span>
            <Package size={29} strokeWidth={1.3} />
            <h3>Practical by nature.</h3>
            <p>
              Power backup, networking, security and everyday accessories.
              Products chosen around the things you need to get done.
            </p>
          </article>
          <article>
            <span>02</span>
            <MessageCircle size={29} strokeWidth={1.3} />
            <h3>A real conversation.</h3>
            <p>
              A model number or a photo is a good place to start. Ask us
              questions, check compatibility, and order with a clearer picture.
            </p>
          </article>
          <article>
            <span>03</span>
            <MapPin size={29} strokeWidth={1.3} />
            <h3>Rooted in the neighbourhood.</h3>
            <p>
              A local store in Phool Nagar, with a simple way to browse and
              place an order wherever you are.
            </p>
          </article>
        </div>
      </section>
      <div className="sf-help-section">
        <NeedHelp />
      </div>
    </div>
  )
}

export function ContactPage() {
  return (
    <div className="sf-container">
      <Breadcrumb items={[{ label: 'Contact' }]} />
      <PageIntro
        eyebrow="A PERSON, A MESSAGE AWAY"
        title="Let’s find the right connection."
      >
        A question about a product? Not sure what fits? We’re here to help.
      </PageIntro>
      <div className="sf-contact-grid">
        <article>
          <MessageCircle size={28} strokeWidth={1.3} />
          <span className="sf-eyebrow">CHAT WITH US</span>
          <h2>A little help on WhatsApp.</h2>
          <p>
            Send a device model, a photo or your shopping list. We’ll help you
            with options and pricing.
          </p>
          <a
            className="sf-button sf-button-dark"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            Start a conversation <ArrowUpRight size={17} />
          </a>
        </article>
        <article>
          <Headphones size={28} strokeWidth={1.3} />
          <span className="sf-eyebrow">GIVE US A CALL</span>
          <h2>Let’s talk it through.</h2>
          <p>
            Prefer a conversation? Call the store with your product question or
            order reference.
          </p>
          <a className="sf-contact-phone" href="tel:+923187083785">
            0318 7083785 <ArrowUpRight size={18} />
          </a>
        </article>
        <article>
          <MapPin size={28} strokeWidth={1.3} />
          <span className="sf-eyebrow">YOUR LOCAL STORE</span>
          <h2>Find us in Phool Nagar.</h2>
          <p>
            Shahzad Electronics
            <br />
            Phool Nagar, Punjab, Pakistan.
          </p>
          <a
            className="sf-text-link"
            href={`${whatsapp}?text=${encodeURIComponent('Hello! Please share your store location and opening hours.')}`}
            target="_blank"
            rel="noreferrer"
          >
            Ask for directions & hours <ArrowUpRight size={16} />
          </a>
        </article>
      </div>
      <section className="sf-faq-section">
        <div>
          <p className="sf-eyebrow">A FEW HELPFUL DETAILS</p>
          <h2>
            Before you
            <br />
            <em>plug in.</em>
          </h2>
          <p>Everything you need for a simpler order.</p>
        </div>
        <div className="sf-faqs">
          <details id="delivery" open>
            <summary>
              How does delivery work? <ChevronDown size={18} />
            </summary>
            <p>
              Delivery is Rs. 250 per order. When your merchandise subtotal is
              greater than Rs. 5,000, delivery is free. We’ll confirm your
              address, delivery availability and timing after you place the
              order.
            </p>
          </details>
          <details>
            <summary>
              How do I place an order and pay? <ChevronDown size={18} />
            </summary>
            <p>
              Add products to your bag and enter your delivery details at
              checkout. We’ll save your order and give you a reference. The
              store will contact you to confirm availability and arrange
              payment. No online payment is taken at checkout.
            </p>
          </details>
          <details id="compatibility">
            <summary>
              Will the router power bank fit my device?{' '}
              <ChevronDown size={18} />
            </summary>
            <p>
              Check that your router uses 12V DC, and that the barrel connector
              size and polarity match. Send us a clear photo of your adapter
              label on WhatsApp before ordering if you’re unsure.
            </p>
          </details>
          <details>
            <summary>
              I can’t find the item I need. <ChevronDown size={18} />
            </summary>
            <p>
              Some electrical, networking, security and accessory items are
              available by enquiry. Send the item name, model or a photo on
              WhatsApp and ask for available options and pricing.
            </p>
          </details>
          <details>
            <summary>
              Can I change an order or ask about a return?{' '}
              <ChevronDown size={18} />
            </summary>
            <p>
              Contact the store with your order reference as soon as possible.
              We’ll discuss the request, the product’s condition and the
              available options before arranging a change or return.
            </p>
          </details>
        </div>
      </section>
    </div>
  )
}
