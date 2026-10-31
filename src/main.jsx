import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight,
  BatteryCharging,
  Cable,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageCircle,
  MapPin,
  Maximize2,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Signal,
  Sparkles,
  Trash2,
  Wifi,
  X,
  Zap,
  Lightbulb,
} from 'lucide-react'
import './styles.css'
import { catalogCategories, enquiryCollections, featuredProduct, products } from './catalog'

const WHATSAPP_NUMBER = '923187083785'
const DISPLAY_PHONE = '0318 7083785'
const DELIVERY_CHARGE = 250
const FREE_DELIVERY_THRESHOLD = 5000
const formatPrice = (amount) => `Rs. ${amount.toLocaleString('en-PK')}`

const enquiryIcons = {
  wifi: Wifi,
  camera: Camera,
  cable: Cable,
  lightbulb: Lightbulb,
}

const productImages = [
  {
    src: '/images/router-power-bank-hero.png',
    alt: 'White 12V router power bank with DC connector in a studio setting',
    label: 'Studio view',
  },
  {
    src: '/images/router-power-bank-catalog.png',
    alt: 'Professional catalog view of the white router power bank and DC cable',
    label: 'Catalog view',
  },
  {
    src: '/images/router-power-bank-controls-pro.png',
    alt: 'Professional close-up of the power switch, indicator lights and charging input',
    label: 'Control detail',
  },
  {
    src: '/images/router-power-bank-in-use.png',
    alt: 'Router power bank placed beside a home Wi-Fi router',
    label: 'In use',
  },
]

const initialForm = {
  name: '',
  phone: '',
  city: '',
  address: '',
  notes: '',
}

function WhatsAppIcon({ size = 20 }) {
  return <MessageCircle size={size} strokeWidth={2.2} aria-hidden="true" />
}

function CatalogCard({ item, onAdd, onEnquire }) {
  const isProduct = typeof item.price === 'number'
  const Icon = !isProduct ? enquiryIcons[item.icon] : null

  return (
    <article className={`catalog-card ${isProduct ? 'catalog-product' : 'catalog-enquiry'}`}>
      <div className="catalog-media">
        {isProduct ? <img src={item.image} alt={item.name} /> : <Icon size={54} strokeWidth={1.35} />}
        <span className="catalog-badge">{isProduct ? item.badge : 'Ask for options'}</span>
      </div>
      <div className="catalog-card-body">
        <span className="catalog-category">{item.category}</span>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="catalog-card-footer">
          {isProduct ? (
            <>
              <strong>{formatPrice(item.price)}</strong>
              <button onClick={() => onAdd(item.id)}><Plus size={16} /> Add to cart</button>
            </>
          ) : (
            <button className="enquiry-button" onClick={() => onEnquire(item)}><WhatsAppIcon size={17} /> Request details</button>
          )}
        </div>
      </div>
    </article>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [imageZoomOpen, setImageZoomOpen] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('shahzad-electronics-cart'))
      return Array.isArray(savedCart) ? savedCart : []
    } catch {
      return []
    }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const cartItems = cart.map((item) => ({
    ...products.find((product) => product.id === item.id),
    quantity: item.quantity,
  })).filter((item) => item.id)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  const deliveryCharge = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE
  const orderTotal = cartItems.length ? subtotal + deliveryCharge : 0
  const deliveryLabel = deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)
  const amountUntilFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD + 1 - subtotal)
  const freeDeliveryProgress = Math.min(100, (subtotal / (FREE_DELIVERY_THRESHOLD + 1)) * 100)
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const catalogItems = [...products, ...enquiryCollections].filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesSearch = !normalizedSearch || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(normalizedSearch)
    return matchesCategory && matchesSearch
  })

  useEffect(() => {
    document.body.style.overflow = orderOpen || imageZoomOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [orderOpen, imageZoomOpen])

  useEffect(() => {
    localStorage.setItem('shahzad-electronics-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOrderOpen(false)
        setImageZoomOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openOrder = () => {
    setMenuOpen(false)
    setOrderOpen(true)
  }

  const addToCart = (productId, openAfterAdd = false) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === productId)
      if (existing) {
        return current.map((item) => item.id === productId ? { ...item, quantity: Math.min(9, item.quantity + 1) } : item)
      }
      return [...current, { id: productId, quantity: 1 }]
    })
    if (openAfterAdd) {
      setMenuOpen(false)
      setOrderOpen(true)
    }
  }

  const updateCartQuantity = (productId, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCart((current) => current.filter((item) => item.id !== productId))
      return
    }
    setCart((current) => current.map((item) => item.id === productId ? { ...item, quantity: Math.min(9, nextQuantity) } : item))
  }

  const removeCartItem = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId))
  }

  const sendEnquiry = (collection) => {
    const message = [
      'Hello Shahzad Electronics!',
      '',
      `I would like to ask about *${collection.name}*.`,
      'Please share available options and prices.',
    ].join('\n')
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }))
  }

  const sendOrder = (event) => {
    event.preventDefault()
    if (!cartItems.length) return
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Please enter your name.'
    if (!form.phone.trim()) nextErrors.phone = 'Please enter your phone number.'
    if (!form.city.trim()) nextErrors.city = 'Please enter your city.'
    if (!form.address.trim()) nextErrors.address = 'Please enter your delivery address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const itemLines = cartItems.map((item) => `• ${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`)

    const lines = [
      'Hello Shahzad Electronics! I would like to order:',
      '',
      '*Order items*',
      ...itemLines,
      '',
      `Subtotal: ${formatPrice(subtotal)}`,
      `Delivery charge: ${deliveryLabel}`,
      `*Total: ${formatPrice(orderTotal)}*`,
      '',
      '*Customer details*',
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `City: ${form.city.trim()}`,
      `Address: ${form.address.trim()}`,
      form.notes.trim() ? `Notes: ${form.notes.trim()}` : '',
      '',
      'Please confirm compatibility and availability.',
    ].filter(Boolean)

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer')
  }

  const nextImage = () => setActiveImage((current) => (current + 1) % productImages.length)
  const previousImage = () => setActiveImage((current) => (current - 1 + productImages.length) % productImages.length)

  return (
    <div className="site-shell">
      <div className="announcement">
        <span><Sparkles size={14} /> ORDERS OVER RS. 5,000 GET <strong>FREE DELIVERY</strong></span>
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">{DISPLAY_PHONE}</a>
      </div>

      <header className="nav-wrap">
        <nav className="nav container" aria-label="Main navigation">
          <a href="#top" className="brand" aria-label="Shahzad Electronics home">
            <span className="brand-mark"><img src="/images/shahzad-se-logo.png" alt="" /></span>
            <span className="brand-text">SHAHZAD<br />ELECTRONICS</span>
          </a>

          <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
            {menuOpen ? <X /> : <Menu />}
          </button>

          <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
            <a href="#shop" onClick={() => setMenuOpen(false)}>Shop</a>
            <a href="#details" onClick={() => setMenuOpen(false)}>Details</a>
            <a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
            <a href="#compatibility" onClick={() => setMenuOpen(false)}>Compatibility</a>
            <button className="nav-order cart-button" onClick={openOrder} aria-label={`Open cart with ${cartCount} items`}><ShoppingBag size={17} /> Cart <span>{cartCount}</span></button>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow"><span></span> SHAHZAD ELECTRONICS · PHOOL NAGAR</div>
            <h1>Stay online when the <em>lights don’t.</em></h1>
            <p className="hero-lede">A compact six-cell power bank made for compatible 12V routers—simple controls, a direct DC lead, and power you can keep close.</p>

            <div className="hero-price">
              <span>12V Router Power Bank</span>
              <strong>{formatPrice(featuredProduct.price)}</strong>
              <small>{formatPrice(DELIVERY_CHARGE)} delivery · Free over {formatPrice(FREE_DELIVERY_THRESHOLD)}</small>
            </div>

            <div className="delivery-offer">
              <span><PackageCheck size={22} /></span>
              <div><strong>Spend over Rs. 5,000 — delivery is FREE</strong><small>Save {formatPrice(DELIVERY_CHARGE)} on delivery</small></div>
            </div>

            <div className="hero-actions">
              <button className="primary-button" onClick={() => addToCart(featuredProduct.id, true)}>
                <ShoppingBag size={19} /> Add to order <ArrowRight size={18} />
              </button>
              <a className="text-link" href="#shop">Browse the store <ArrowRight size={17} /></a>
            </div>

            <div className="proof-row" aria-label="Product highlights">
              <div><BatteryCharging /><span><strong>6-cell</strong> battery pack</span></div>
              <div><Zap /><span><strong>12V</strong> router output</span></div>
              <div><PackageCheck /><span><strong>Direct</strong> WhatsApp order</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-orbit orbit-one"></div>
            <div className="hero-orbit orbit-two"></div>
            <img src="/images/router-power-bank-hero.png" alt="12V router power bank with DC cable" />
            <div className="hero-chip chip-top"><span className="pulse"></span> Ready when needed</div>
            <div className="hero-chip chip-bottom"><Signal size={17} /> Built for compatible routers</div>
          </div>
        </section>

        <section className="catalog-section" id="shop">
          <div className="container">
            <div className="catalog-heading">
              <div>
                <div className="section-kicker">THE SHAHZAD ELECTRONICS STORE</div>
                <h2>Power, connectivity and electronics—one simple order.</h2>
              </div>
              <p>Shop verified products or message us for pricing and availability across our electronics collections.</p>
            </div>

            <div className="catalog-toolbar">
              <label className="catalog-search">
                <Search size={18} />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search products or categories" aria-label="Search products" />
                {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={15} /></button>}
              </label>
              <div className="category-tabs" aria-label="Product categories">
                {catalogCategories.map((category) => (
                  <button className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)} key={category}>{category}</button>
                ))}
              </div>
            </div>

            {catalogItems.length ? (
              <div className="catalog-grid">
                {catalogItems.map((item) => <CatalogCard item={item} onAdd={addToCart} onEnquire={sendEnquiry} key={item.id} />)}
              </div>
            ) : (
              <div className="catalog-empty"><Search size={24} /><strong>No matching items</strong><span>Try another search or request the item on WhatsApp.</span></div>
            )}
          </div>
        </section>

        <section className="ticker" aria-label="Product features">
          <div className="ticker-track">
            <span>12V OUTPUT</span><i></i><span>6-CELL PACK</span><i></i><span>FREE DELIVERY OVER RS. 5,000</span><i></i><span>LED INDICATOR</span><i></i><span>DC CONNECTOR</span><i></i><span>12V OUTPUT</span><i></i><span>6-CELL PACK</span><i></i><span>FREE DELIVERY OVER RS. 5,000</span><i></i>
          </div>
        </section>

        <section className="story-section container" id="details">
          <div className="section-kicker">SMALL DEVICE. BIG RELIEF.</div>
          <div className="story-grid">
            <h2>Your router shouldn’t stop because the grid does.</h2>
            <div className="story-copy">
              <p>Shahzad Electronics brings compatible 12V routers a portable backup power source in a compact, practical shell. Connect, switch on, and keep essential connectivity within reach.</p>
              <p className="fine-print">Always confirm your router’s voltage, connector size and polarity before ordering.</p>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-card feature-dark">
              <div className="feature-number">01</div>
              <BatteryCharging size={34} />
              <h3>Six-cell battery pack</h3>
              <p>A rechargeable internal pack in a compact enclosure that is easy to place beside your router.</p>
              <div className="battery-art" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
            </article>
            <article className="feature-card feature-light">
              <div className="feature-number">02</div>
              <Zap size={34} />
              <h3>Simple physical controls</h3>
              <p>A clear rocker switch, status indicators, charging input and attached DC output lead.</p>
              <div className="switch-art" aria-hidden="true"><span>I</span><span>O</span></div>
            </article>
            <article className="feature-card feature-olive">
              <div className="feature-number">03</div>
              <Signal size={34} />
              <h3>Made for 12V routers</h3>
              <p>Check the label on your router adapter, then message us a photo to confirm compatibility.</p>
              <div className="signal-art" aria-hidden="true"><i></i><i></i><i></i></div>
            </article>
          </div>
        </section>

        <section className="gallery-section" id="gallery">
          <div className="container">
            <div className="gallery-heading">
              <div>
                <div className="section-kicker">LOOK CLOSER</div>
                <h2>Every side, no surprises.</h2>
              </div>
              <div className="gallery-controls">
                <button onClick={previousImage} aria-label="Previous image"><ChevronLeft /></button>
                <span>{String(activeImage + 1).padStart(2, '0')} / {String(productImages.length).padStart(2, '0')}</span>
                <button onClick={nextImage} aria-label="Next image"><ChevronRight /></button>
              </div>
            </div>

            <div className="gallery-viewer">
              <button className="main-image-wrap" onClick={() => setImageZoomOpen(true)} aria-label={`Open full-size ${productImages[activeImage].label} image`}>
                <img src={productImages[activeImage].src} alt={productImages[activeImage].alt} />
                <span className="image-label">{productImages[activeImage].label}</span>
                <span className="image-zoom-hint"><Maximize2 size={15} /> View full size</span>
              </button>
              <div className="thumbnail-list">
                {productImages.map((image, index) => (
                  <button className={activeImage === index ? 'active' : ''} onClick={() => setActiveImage(index)} key={image.src} aria-label={`View ${image.label}`}>
                    <img src={image.src} alt="" />
                    <span>{image.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="compatibility container" id="compatibility">
          <div className="compatibility-card">
            <div className="compatibility-copy">
              <div className="section-kicker light">CHECK BEFORE YOU CONNECT</div>
              <h2>Three quick checks for a safe match.</h2>
              <p>Router models vary. Send us a clear photo of your router’s power adapter label on WhatsApp and we’ll help you compare the basics before you order.</p>
              <button className="cream-button" onClick={() => addToCart(featuredProduct.id, true)}>Add compatible unit <ArrowRight size={18} /></button>
            </div>
            <ol className="check-list">
              <li><span>01</span><div><strong>Voltage</strong><p>Your router adapter should show 12V DC.</p></div><Check /></li>
              <li><span>02</span><div><strong>Connector</strong><p>Confirm the barrel plug size matches.</p></div><Check /></li>
              <li><span>03</span><div><strong>Polarity</strong><p>Check the positive and negative symbol.</p></div><Check /></li>
            </ol>
          </div>
        </section>

        <section className="order-banner container">
          <div className="order-banner-inner">
            <div>
              <div className="section-kicker">READY TO STAY CONNECTED?</div>
              <h2>Build your order. Confirm everything on WhatsApp.</h2>
            <p className="order-price-note">From {formatPrice(featuredProduct.price)} <span>+ {formatPrice(DELIVERY_CHARGE)} delivery · Free over {formatPrice(FREE_DELIVERY_THRESHOLD)}</span></p>
            </div>
            <a className="primary-button" href="#shop"><ShoppingBag size={19} /> Browse products <ArrowRight size={18} /></a>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-grid">
          <a href="#top" className="brand footer-brand">
            <span className="brand-mark"><img src="/images/shahzad-se-logo.png" alt="" /></span>
            <span className="brand-text">SHAHZAD<br />ELECTRONICS</span>
          </a>
          <div className="footer-location"><MapPin size={18} /><div><span>Store location</span><strong>Phool Nagar, Punjab</strong></div></div>
          <div className="footer-contact"><span>Call & WhatsApp</span><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">{DISPLAY_PHONE}</a></div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} Shahzad Electronics</span><span>All electronics-related products available</span></div>
      </footer>

      <button className="floating-whatsapp floating-cart" onClick={openOrder} aria-label={`Open cart with ${cartCount} items`}><ShoppingBag size={23} /><span>Cart</span>{cartCount > 0 && <b>{cartCount}</b>}</button>

      {imageZoomOpen && (
        <div className="zoom-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setImageZoomOpen(false) }}>
          <section className="zoom-dialog" role="dialog" aria-modal="true" aria-label="Full-size product image">
            <button className="zoom-close" onClick={() => setImageZoomOpen(false)} aria-label="Close full-size image"><X /></button>
            <button className="zoom-nav zoom-previous" onClick={previousImage} aria-label="Previous product image"><ChevronLeft /></button>
            <img src={productImages[activeImage].src} alt={productImages[activeImage].alt} />
            <button className="zoom-nav zoom-next" onClick={nextImage} aria-label="Next product image"><ChevronRight /></button>
            <div className="zoom-caption"><span>{productImages[activeImage].label}</span><span>{activeImage + 1} / {productImages.length}</span></div>
          </section>
        </div>
      )}

      {orderOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOrderOpen(false) }}>
          <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
            <button className="modal-close" onClick={() => setOrderOpen(false)} aria-label="Close order form"><X /></button>
            <div className="modal-heading">
              <span className="modal-icon"><ShoppingBag /></span>
              <div><p>YOUR CART</p><h2 id="order-title">Review your order.</h2></div>
            </div>

            {cartItems.length ? (
              <>
                <div className="cart-list">
                  {cartItems.map((item) => (
                    <div className="cart-line" key={item.id}>
                      <img src={item.image} alt="" />
                      <div className="cart-line-copy"><strong>{item.name}</strong><span>{formatPrice(item.price)} each</span></div>
                      <div className="cart-line-actions">
                        <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                          <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={14} /></button>
                        </div>
                        <button className="remove-cart-item" onClick={() => removeCartItem(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="price-summary" aria-label="Order price summary">
                  <div><span>Products ({cartCount})</span><strong>{formatPrice(subtotal)}</strong></div>
                  <div><span>Delivery charge</span><strong className={deliveryCharge === 0 ? 'free-delivery' : ''}>{deliveryLabel}</strong></div>
                  <div className="price-total"><span>Total</span><strong>{formatPrice(orderTotal)}</strong></div>
                </div>

                <div className={`shipping-offer ${deliveryCharge === 0 ? 'unlocked' : ''}`}>
                  <PackageCheck size={22} />
                  <div>
                    <strong>{deliveryCharge === 0 ? 'Free delivery unlocked!' : `Add ${formatPrice(amountUntilFreeDelivery)} more for free delivery`}</strong>
                    <span>{deliveryCharge === 0 ? `You saved ${formatPrice(DELIVERY_CHARGE)} on delivery.` : `Free delivery on orders over ${formatPrice(FREE_DELIVERY_THRESHOLD)}.`}</span>
                    <div className="shipping-progress" aria-hidden="true"><i style={{ width: `${freeDeliveryProgress}%` }}></i></div>
                  </div>
                </div>

                <form onSubmit={sendOrder} noValidate>
                  <div className="form-row">
                    <label>Name<input name="name" value={form.name} onChange={updateField} placeholder="Your full name" autoComplete="name" />{errors.name && <small>{errors.name}</small>}</label>
                    <label>Phone<input name="phone" value={form.phone} onChange={updateField} placeholder="03xx xxxxxxx" inputMode="tel" autoComplete="tel" />{errors.phone && <small>{errors.phone}</small>}</label>
                  </div>
                  <label>City<input name="city" value={form.city} onChange={updateField} placeholder="Your city" autoComplete="address-level2" />{errors.city && <small>{errors.city}</small>}</label>
                  <label>Delivery address<textarea name="address" value={form.address} onChange={updateField} placeholder="House, street and area" rows="3" autoComplete="street-address" />{errors.address && <small>{errors.address}</small>}</label>
                  <label>Order note <span>(optional)</span><textarea name="notes" value={form.notes} onChange={updateField} placeholder="Product model or any question" rows="2" /></label>
                  <button className="whatsapp-submit" type="submit"><WhatsAppIcon /> Send full order on WhatsApp <ArrowRight size={18} /></button>
                  <p className="form-note"><ShieldCheck size={15} /> Your cart and details are only added to the WhatsApp message. Nothing is stored on this website.</p>
                </form>
              </>
            ) : (
              <div className="empty-cart">
                <span><ShoppingBag size={30} /></span>
                <h3>Your cart is empty</h3>
                <p>Browse the store and add products before checking out.</p>
                <a href="#shop" onClick={() => setOrderOpen(false)}>Browse products <ArrowRight size={17} /></a>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
