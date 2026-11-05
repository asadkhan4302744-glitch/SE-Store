import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  Cable,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Headphones,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  Truck,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import { enquiryCollections } from './catalog'
import { request, money, whatsapp } from './api'
import {
  Brand,
  Dialog,
  EmptyState,
  ErrorNotice,
  ProductMedia,
} from './components'
import Admin from './Admin'
import './styles.css'

const initialCustomer = {
  name: '',
  phone: '',
  city: '',
  address: '',
  notes: '',
}
const collectionIcons = {
  wifi: Wifi,
  camera: Camera,
  cable: Cable,
  lightbulb: Zap,
}
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('shahzad-electronics-cart'))
    return Array.isArray(saved)
      ? saved
          .filter(
            (item, i, all) =>
              typeof item?.id === 'string' &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              item.quantity <= 99 &&
              all.findIndex((other) => other.id === item.id) === i,
          )
          .slice(0, 30)
      : []
  } catch {
    return []
  }
}

function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cart, setCart] = useState(loadCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All products')
  const [sort, setSort] = useState('featured')
  const [customer, setCustomer] = useState(initialCustomer)
  const [checkoutError, setCheckoutError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [toast, setToast] = useState('')
  const checkoutKey = useRef(null)
  const toastTimer = useRef(null)
  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setProducts((await request('/products')).products)
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    refresh()
  }, [refresh])
  useEffect(() => {
    try {
      localStorage.setItem('shahzad-electronics-cart', JSON.stringify(cart))
    } catch {
      /* cart works without storage */
    }
  }, [cart])
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  const categories = [
    'All products',
    ...new Set(products.map((p) => p.category)),
  ]
  const filtered = products
    .filter(
      (p) =>
        (category === 'All products' || category === p.category) &&
        `${p.name} ${p.description} ${p.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'low'
        ? a.price - b.price
        : sort === 'high'
          ? b.price - a.price
          : 0,
    )
  const lines = cart.map((line) => ({
    ...line,
    product: products.find((p) => p.id === line.id),
  }))
  const availableLines = lines.filter((line) => line.product)
  const subtotal =
    Math.round(
      availableLines.reduce(
        (sum, line) => sum + line.product.price * line.quantity,
        0,
      ) * 100,
    ) / 100
  const delivery = subtotal > 5000 ? 0 : 250
  const count = cart.reduce((sum, line) => sum + line.quantity, 0)
  const invalidCart = lines.some(
    (line) => !line.product || line.quantity > line.product.stock,
  )
  function updateCart(id, quantity) {
    checkoutKey.current = null
    setCheckoutError('')
    setCart((current) =>
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.some((line) => line.id === id)
          ? current.map((line) =>
              line.id === id ? { ...line, quantity } : line,
            )
          : [...current, { id, quantity }],
    )
  }
  function add(product) {
    const existing = cart.find((line) => line.id === product.id)?.quantity || 0
    if (!existing && cart.length >= 30) {
      notify('Your bag can hold 30 different products.')
      return
    }
    if (existing >= Math.min(product.stock, 99)) {
      notify('You’ve reached the available quantity.')
      return
    }
    updateCart(product.id, existing + 1)
    notify(`${product.name} added to your bag`)
  }
  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3500)
  }
  async function placeOrder(event) {
    event.preventDefault()
    if (submitting || invalidCart || !availableLines.length) return
    setSubmitting(true)
    setCheckoutError('')
    checkoutKey.current ||= crypto.randomUUID()
    try {
      const { order } = await request('/orders', {
        method: 'POST',
        body: { items: cart, customer, checkoutKey: checkoutKey.current },
      })
      setReceipt({ ...order, customer: { ...customer } })
      setCart([])
      setCustomer(initialCustomer)
      checkoutKey.current = null
      refresh()
    } catch (error) {
      setCheckoutError(error.message)
      if (error.status === 409) {
        checkoutKey.current = null
        refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }
  const receiptMessage =
    receipt &&
    `Hello Shahzad Electronics! My order is ${receipt.id}.\n${receipt.items.map((item) => `${item.name} × ${item.quantity} — ${money(item.price * item.quantity)}`).join('\n')}\nTotal: ${money(receipt.total)}\nName: ${receipt.customer.name}\nPlease confirm availability and payment details.`
  return (
    <>
      <div className="announcement">
        <span>
          <Truck size={13} /> A little extra, on us. Free delivery on orders
          over Rs. 5,000.
        </span>
        <a href={whatsapp} target="_blank" rel="noreferrer">
          Talk to us <ArrowUpRight size={13} />
        </a>
      </div>
      <header className="site-header">
        <div className="container navigation">
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#shop">Shop all</a>
            <a href="#collections">Collections</a>
            <a href="#about">Our store</a>
          </nav>
          <button
            className="bag-button"
            onClick={() => {
              setReceipt(null)
              setCartOpen(true)
            }}
            aria-label={`Open shopping bag, ${count} items`}
          >
            <ShoppingBag size={19} />
            <span>Bag</span>
            <b>{count}</b>
          </button>
        </div>
      </header>
      <main>
        <section className="hero container" id="top">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> EVERYDAY ELECTRONICS, SIMPLY.
            </p>
            <h1>
              Good things.
              <br />
              Powered <em>better.</em>
            </h1>
            <p className="hero-description">
              From keeping your Wi-Fi on to connecting the everyday. Practical
              electronics, personal service, all in one place.
            </p>
            <a className="button button-dark" href="#shop">
              Explore the store <ArrowRight size={17} />
            </a>
            <div className="hero-note">
              <MapPin size={14} /> Your local electronics store in Phool Nagar
            </div>
          </div>
          <div className="hero-picture">
            <img
              src="/images/router-power-bank-hero.png"
              alt="White 12V router power bank with its DC connector"
            />
            <div className="hero-label">
              <span>
                <BatteryCharging size={18} /> SMALL DEVICE. BIG RELIEF.
              </span>
              <strong>
                A little backup.
                <br />A lot of peace of mind.
              </strong>
              <a href="#shop" aria-label="Shop power and backup">
                <ArrowUpRight size={22} />
              </a>
            </div>
            <span className="picture-tag">
              <span /> The power & backup collection
            </span>
          </div>
        </section>
        <div className="benefits container">
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
              <strong>Shop with a real store</strong>
              <small>Shahzad Electronics, Phool Nagar</small>
            </span>
          </div>
          <div>
            <MessageCircle />
            <span>
              <strong>A person, a message away</strong>
              <small>Get help choosing on WhatsApp</small>
            </span>
          </div>
        </div>
        <section id="shop" className="shop-section container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE EVERYDAY EDIT</p>
              <h2>
                Made for your everyday<span>.</span>
              </h2>
            </div>
            <p>
              Useful things. Straightforward prices.
              <br />
              Find your next essential.
            </p>
          </div>
          <div className="shop-tools">
            <label className="search-field">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find something good…"
                aria-label="Search products"
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <label className="sort-field">
              <SlidersHorizontal size={15} />
              <span className="sr-only">Sort products</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          <div className="category-row">
            <div className="category-tabs" aria-label="Filter by category">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? 'selected' : ''}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                  {item === 'All products' && <span>{products.length}</span>}
                </button>
              ))}
            </div>
            <span className="result-count">
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </span>
          </div>
          {loading ? (
            <div
              className="product-grid"
              aria-label="Loading products"
              aria-busy="true"
            >
              {[1, 2, 3].map((i) => (
                <div className="skeleton-card" key={i}>
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <EmptyState icon={Package} title="We couldn’t load the shelves.">
              <p>{loadError}</p>
              <button className="button button-outline" onClick={refresh}>
                Try again <ArrowRight size={16} />
              </button>
            </EmptyState>
          ) : filtered.length ? (
            <div className="product-grid">
              {filtered.map((product) => (
                <article className="product-card" key={product.id}>
                  <button
                    className="product-photo-button"
                    onClick={() => setDetail(product)}
                    aria-label={`View ${product.name}`}
                  >
                    <ProductMedia product={product} />
                    {(product.badge || !product.stock) && (
                      <span
                        className={`product-badge ${!product.stock ? 'muted' : ''}`}
                      >
                        {product.stock ? product.badge : 'Sold out'}
                      </span>
                    )}
                    <span className="view-product">
                      <ArrowUpRight size={18} />
                    </span>
                  </button>
                  <div className="product-info">
                    <span className="product-category">{product.category}</span>
                    <button
                      className="product-title"
                      onClick={() => setDetail(product)}
                    >
                      <h3>{product.name}</h3>
                    </button>
                    <p>{product.description}</p>
                    <div className="product-bottom">
                      <strong>{money(product.price)}</strong>
                      <button
                        className="add-button"
                        onClick={() => add(product)}
                        disabled={!product.stock}
                        aria-label={`Add ${product.name} to bag`}
                      >
                        {product.stock ? 'Add to bag' : 'Sold out'}
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={Search} title="Nothing here just yet.">
              <p>Try a different search or explore all products.</p>
              <button
                className="button button-outline"
                onClick={() => {
                  setQuery('')
                  setCategory('All products')
                }}
              >
                Reset filters
              </button>
            </EmptyState>
          )}
        </section>
        <section className="collections-section" id="collections">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MORE WAYS TO CONNECT</p>
                <h2>Looking for something else?</h2>
              </div>
              <a
                className="text-link"
                href={`${whatsapp}?text=${encodeURIComponent('Hello! I’m looking for an electronic item. Can you help?')}`}
                target="_blank"
                rel="noreferrer"
              >
                Let’s find it <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="collection-grid">
              {enquiryCollections.map((collection) => {
                const Icon = collectionIcons[collection.icon]
                return (
                  <a
                    className="collection-card"
                    key={collection.id}
                    href={`${whatsapp}?text=${encodeURIComponent(`Hello Shahzad Electronics! Please share available options and prices for ${collection.name}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="collection-icon">
                      <Icon size={28} strokeWidth={1.3} />
                    </span>
                    <span>
                      <h3>{collection.name}</h3>
                      <small>Ask for options & prices</small>
                    </span>
                    <ArrowUpRight size={18} />
                  </a>
                )
              })}
            </div>
          </div>
        </section>
        <section className="about-section container" id="about">
          <div>
            <p className="eyebrow">LOCAL STORE. PERSONAL SERVICE.</p>
            <h2>
              Electronics made simple.
              <br />
              <em>That’s our kind of thing.</em>
            </h2>
          </div>
          <div>
            <p>
              We’re Shahzad Electronics, your neighbourhood electronics store in
              Phool Nagar. We keep things practical: useful products, clear
              prices, and someone to talk to when you need a hand.
            </p>
            <a
              href={whatsapp}
              className="text-link"
              target="_blank"
              rel="noreferrer"
            >
              Say hello on WhatsApp <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
        <section className="help-banner container">
          <div className="help-icon">
            <Headphones size={30} strokeWidth={1.4} />
          </div>
          <div>
            <h3>Not sure what you need?</h3>
            <p>
              Send us your device model or a photo. We’ll help you find the
              right fit.
            </p>
          </div>
          <a
            href={whatsapp}
            className="button button-dark"
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={17} /> Ask us on WhatsApp{' '}
            <ArrowUpRight size={16} />
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-main">
          <div>
            <Brand />
            <p>A little power for the everyday.</p>
          </div>
          <div>
            <span className="footer-label">FIND US</span>
            <p>
              Phool Nagar, Punjab
              <br />
              Pakistan
            </p>
          </div>
          <div>
            <span className="footer-label">GET IN TOUCH</span>
            <a href={whatsapp} target="_blank" rel="noreferrer">
              0318 7083785 <ArrowUpRight size={14} />
            </a>
            <small>Call or WhatsApp</small>
          </div>
          <a className="back-top" href="#top">
            Back to top <ArrowDown size={15} />
          </a>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Shahzad Electronics.</span>
          <span>Simple things. Better connected.</span>
          <a href="/admin">
            Store admin <ArrowUpRight size={12} />
          </a>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button
            onClick={() => {
              setReceipt(null)
              setCartOpen(true)
            }}
          >
            View bag <ArrowRight size={14} />
          </button>
        </div>
      )}
      {detail && (
        <Dialog title="A closer look" onClose={() => setDetail(null)} wide>
          <div className="product-detail">
            <ProductMedia product={detail} />
            <div>
              <p className="eyebrow">{detail.category}</p>
              <h2>{detail.name}</h2>
              <p>{detail.description}</p>
              <strong className="detail-price">{money(detail.price)}</strong>
              <p className="stock-note">
                <span
                  className={detail.stock ? 'stock-dot' : 'stock-dot out'}
                />
                {detail.stock
                  ? `${detail.stock} available`
                  : 'Currently sold out'}
              </p>
              {detail.id.startsWith('router-power-bank') && (
                <p className="compatibility-note">
                  Please confirm your router’s 12V output, connector size and
                  polarity before ordering. Send us a photo of your adapter if
                  you need help.
                </p>
              )}
              <button
                className="button button-dark"
                disabled={!detail.stock}
                onClick={() => {
                  add(detail)
                  setDetail(null)
                }}
              >
                Add to bag <Plus size={17} />
              </button>
              <small className="delivery-note">
                Rs. 250 delivery · free on orders over Rs. 5,000
              </small>
            </div>
          </div>
        </Dialog>
      )}
      {cartOpen && (
        <Dialog
          title={receipt ? 'Thank you for your order.' : `Your bag (${count})`}
          onClose={() => {
            if (!submitting) setCartOpen(false)
          }}
        >
          {receipt ? (
            <div className="receipt">
              <span className="success-icon">
                <Check size={28} />
              </span>
              <p className="eyebrow">ORDER RECEIVED</p>
              <h3>You’re on our list.</h3>
              <p>
                Your order <strong>{receipt.id}</strong> has been saved. We’ll
                contact you to confirm availability, delivery and payment
                details.
              </p>
              <div className="receipt-lines">
                {receipt.items.map((item) => (
                  <div key={item.id}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                ))}
                <div>
                  <span>Delivery</span>
                  <strong>
                    {receipt.delivery ? money(receipt.delivery) : 'Free'}
                  </strong>
                </div>
                <div className="total-row">
                  <span>Total</span>
                  <strong>{money(receipt.total)}</strong>
                </div>
              </div>
              <a
                className="button button-dark"
                href={`${whatsapp}?text=${encodeURIComponent(receiptMessage)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} /> Follow up on WhatsApp{' '}
                <ArrowUpRight size={16} />
              </a>
              <button className="text-link" onClick={() => setCartOpen(false)}>
                Keep exploring <ArrowRight size={16} />
              </button>
            </div>
          ) : loading && !products.length ? (
            <EmptyState icon={ShoppingBag} title="Opening your bag…">
              <p>Checking the latest products and availability.</p>
            </EmptyState>
          ) : loadError && !products.length ? (
            <EmptyState icon={Package} title="We couldn’t check your bag.">
              <p>{loadError}</p>
              <button className="button button-outline" onClick={refresh}>
                Try again
              </button>
            </EmptyState>
          ) : !cart.length ? (
            <EmptyState icon={ShoppingBag} title="Room for something good.">
              <p>
                Your bag is empty. Find an everyday essential to get started.
              </p>
              <button
                className="button button-dark"
                onClick={() => {
                  setCartOpen(false)
                  document.getElementById('shop').scrollIntoView()
                }}
              >
                Explore the store <ArrowRight size={16} />
              </button>
            </EmptyState>
          ) : (
            <>
              <div className="cart-lines">
                {lines.map(({ id, quantity, product }) => (
                  <div className="cart-line" key={id}>
                    {product ? (
                      <ProductMedia product={product} />
                    ) : (
                      <div className="cart-placeholder">
                        <Package />
                      </div>
                    )}
                    <div className="cart-line-copy">
                      <strong>{product?.name || 'Unavailable product'}</strong>
                      <span>
                        {product
                          ? money(product.price)
                          : 'Please remove this item'}
                      </span>
                      <div className="quantity-control">
                        <button
                          disabled={submitting}
                          onClick={() => updateCart(id, quantity - 1)}
                          aria-label={`Decrease ${product?.name || 'item'} quantity`}
                        >
                          <Minus size={13} />
                        </button>
                        <span>{quantity}</span>
                        <button
                          disabled={
                            submitting ||
                            !product ||
                            quantity >= Math.min(product.stock, 99)
                          }
                          onClick={() => updateCart(id, quantity + 1)}
                          aria-label={`Increase ${product?.name || 'item'} quantity`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      {product && quantity > product.stock && (
                        <small className="field-error">
                          Only {product.stock} available. Reduce the quantity.
                        </small>
                      )}
                    </div>
                    <button
                      className="icon-button"
                      disabled={submitting}
                      onClick={() => updateCart(id, 0)}
                      aria-label={`Remove ${product?.name || 'unavailable item'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="order-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div>
                  <span>Delivery</span>
                  <strong>{delivery ? money(delivery) : 'On us'}</strong>
                </div>
                <div className="total-row">
                  <span>Total</span>
                  <strong>{money(subtotal + delivery)}</strong>
                </div>
              </div>
              <p className="shipping-note">
                <Truck size={16} />
                {delivery
                  ? 'Free delivery on orders over Rs. 5,000.'
                  : 'You’ve unlocked free delivery. Nice choice.'}
              </p>
              <form className="checkout-form" onSubmit={placeOrder}>
                <h3>Where should we send it?</h3>
                <fieldset disabled={submitting}>
                  <div className="form-row">
                    <label>
                      Full name
                      <input
                        required
                        maxLength={100}
                        autoComplete="name"
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer({ ...customer, name: e.target.value })
                        }
                        placeholder="Your full name"
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        required
                        type="tel"
                        maxLength={25}
                        autoComplete="tel"
                        placeholder="03xx xxxxxxx"
                        value={customer.phone}
                        onChange={(e) =>
                          setCustomer({ ...customer, phone: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    City
                    <input
                      required
                      maxLength={80}
                      autoComplete="address-level2"
                      placeholder="Your city"
                      value={customer.city}
                      onChange={(e) =>
                        setCustomer({ ...customer, city: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Delivery address
                    <textarea
                      required
                      maxLength={400}
                      rows={2}
                      autoComplete="street-address"
                      placeholder="House, street and area"
                      value={customer.address}
                      onChange={(e) =>
                        setCustomer({ ...customer, address: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Order note <span>(optional)</span>
                    <textarea
                      maxLength={500}
                      rows={2}
                      placeholder="A device model, question or delivery instruction…"
                      value={customer.notes}
                      onChange={(e) =>
                        setCustomer({ ...customer, notes: e.target.value })
                      }
                    />
                  </label>
                </fieldset>
                <ErrorNotice>{checkoutError}</ErrorNotice>
                <button
                  className="button button-dark full-width"
                  type="submit"
                  disabled={submitting || invalidCart || loading || !!loadError}
                >
                  {submitting ? 'Placing your order…' : 'Place order'}
                  <ArrowRight size={17} />
                </button>
                <p className="form-note">
                  <ShieldCheck size={14} />
                  Your order and delivery details are saved securely for the
                  store to fulfil your order. Payment is arranged after
                  confirmation.
                </p>
              </form>
            </>
          )}
        </Dialog>
      )}
    </>
  )
}

const isAdmin =
  window.location.pathname === '/admin' ||
  window.location.pathname.startsWith('/admin/')
createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isAdmin ? <Admin /> : <Store />}</React.StrictMode>,
)
