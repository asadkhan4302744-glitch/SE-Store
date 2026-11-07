import React from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { EmptyState, ErrorNotice } from './components'
import { money, whatsapp } from './api'
import { Link, useRoute } from './router'
import { orderWhatsAppUrl } from './order-whatsapp'
import CouponField from './CouponField'
import {
  Breadcrumb,
  CartLines,
  OrderTotals,
  PageIntro,
} from './store-components'

function CartGuard({ store, children }) {
  if (store.loading && !store.products.length)
    return (
      <div className="sf-container sf-purchase-empty">
        <EmptyState icon={ShoppingBag} title="Opening your bag…">
          <p>Checking the latest products and availability.</p>
        </EmptyState>
      </div>
    )
  if (store.error)
    return (
      <div className="sf-container sf-purchase-empty">
        <EmptyState icon={Package} title="We couldn’t check your bag.">
          <p>{store.error}</p>
          <button
            className="sf-button sf-button-outline"
            onClick={store.refresh}
          >
            Try again <ArrowRight size={16} />
          </button>
        </EmptyState>
      </div>
    )
  if (!store.cart.length)
    return (
      <div className="sf-container sf-purchase-empty">
        <Breadcrumb items={[{ label: 'Your bag' }]} />
        <EmptyState icon={ShoppingBag} title="Room for something good.">
          <p>
            Your bag is waiting for an everyday essential. Let’s find yours.
          </p>
          <Link className="sf-button sf-button-dark" href="/shop">
            Explore the store <ArrowRight size={17} />
          </Link>
        </EmptyState>
      </div>
    )
  return children
}

export function CartPage({ store }) {
  return (
    <CartGuard store={store}>
      <div className="sf-container">
        <Breadcrumb items={[{ label: 'Your bag' }]} />
        <div className="sf-cart-page-heading">
          <PageIntro
            eyebrow="GOOD THINGS, ALL TOGETHER"
            title="Your shopping bag."
          >
            {store.count} {store.count === 1 ? 'essential' : 'essentials'},
            ready for a closer look.
          </PageIntro>
          <Link className="sf-text-link" href="/shop">
            <ArrowLeft size={15} /> Keep exploring
          </Link>
        </div>
        <div className="sf-purchase-layout">
          <section className="sf-bag-items">
            <div className="sf-bag-table-heading">
              <span>Product</span>
              <span>Subtotal</span>
            </div>
            <CartLines store={store} />
            <div className="sf-delivery-progress">
              <Truck size={22} />
              <div>
                <strong>
                  {store.delivery
                    ? 'A little more, and delivery is on us.'
                    : 'Good news. Your delivery is on us.'}
                </strong>
                <p>
                  {store.delivery
                    ? `Free delivery when your product subtotal is over ${money(5000)}.`
                    : 'Your order has unlocked free delivery.'}
                </p>
                <div
                  role="progressbar"
                  aria-label="Progress towards free delivery"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(
                    100,
                    Math.floor((store.subtotal / 5001) * 100),
                  )}
                >
                  <span
                    style={{
                      width: `${Math.min(100, (store.subtotal / 5001) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
          <aside className="sf-order-summary">
            <p className="sf-eyebrow">THE LITTLE DETAILS</p>
            <h2>Order summary</h2>
            <CouponField store={store} />
            <OrderTotals store={store} />
            {store.invalidCart && (
              <ErrorNotice>
                Please update or remove unavailable items before checking out.
              </ErrorNotice>
            )}
            <Link
              className={`sf-button sf-button-dark sf-wide ${store.invalidCart ? 'sf-disabled-link' : ''}`}
              href="/checkout"
              aria-disabled={store.invalidCart}
              onClick={(e) => {
                if (store.invalidCart) e.preventDefault()
              }}
            >
              Continue to checkout <ArrowRight size={18} />
            </Link>
            <p className="sf-summary-note">
              <ShieldCheck size={15} /> Your order is confirmed personally by
              the store.
            </p>
            <div className="sf-summary-help">
              <span>A question before you order?</span>
              <a href={whatsapp} target="_blank" rel="noreferrer">
                We’re a message away <ArrowUpRight size={14} />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </CartGuard>
  )
}

export function CheckoutPage({ store }) {
  const { navigate } = useRoute()
  async function submit(event) {
    event.preventDefault()
    if (
      store.submitting ||
      store.checkingCoupon ||
      store.invalidCart ||
      store.loading ||
      store.error
    )
      return
    // Open during the click so async checkout does not trigger a popup blocker.
    let whatsappWindow = null
    try {
      whatsappWindow = window.open('about:blank', '_blank')
      if (whatsappWindow) {
        whatsappWindow.opener = null
        whatsappWindow.document.title =
          'Saving your order — Shahzad Electronics'
        whatsappWindow.document.body.textContent =
          'Saving your order. WhatsApp will open once it is saved.'
      }
    } catch {
      /* The confirmation page also has a direct WhatsApp link. */
    }
    const order = await store.placeOrder()
    if (!order) {
      whatsappWindow?.close()
      return
    }
    store.setToast('')
    navigate('/order-confirmation')
    try {
      if (whatsappWindow && !whatsappWindow.closed)
        whatsappWindow.location.replace(order.whatsappUrl)
    } catch {
      whatsappWindow?.close()
    }
  }
  return (
    <CartGuard store={store}>
      <div className="sf-container">
        <Breadcrumb
          items={[{ label: 'Your bag', href: '/cart' }, { label: 'Checkout' }]}
        />
        <div className="sf-checkout-heading">
          <PageIntro
            eyebrow="ONE LAST LITTLE STEP"
            title="Let’s make it yours."
          >
            Tell us where to send your everyday essentials.
          </PageIntro>
          <div className="sf-checkout-steps">
            <Link href="/cart">
              <Check size={13} /> Bag
            </Link>
            <ChevronRight size={13} />
            <span className="active">
              <b>2</b> Details
            </span>
            <ChevronRight size={13} />
            <span>
              <b>3</b> Confirmation
            </span>
          </div>
        </div>
        <div className="sf-purchase-layout sf-checkout-layout">
          <form className="sf-checkout-form" onSubmit={submit}>
            <fieldset disabled={store.submitting}>
              <section className="sf-form-section">
                <div className="sf-form-section-heading">
                  <span>01</span>
                  <div>
                    <h2>How can we reach you?</h2>
                    <p>We’ll use these details to confirm your order.</p>
                  </div>
                </div>
                <div className="sf-form-row">
                  <label>
                    Full name
                    <input
                      required
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Your full name"
                      value={store.customer.name}
                      onChange={(e) =>
                        store.setCustomer({
                          ...store.customer,
                          name: e.target.value,
                        })
                      }
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
                      value={store.customer.phone}
                      onChange={(e) =>
                        store.setCustomer({
                          ...store.customer,
                          phone: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </section>
              <section className="sf-form-section">
                <div className="sf-form-section-heading">
                  <span>02</span>
                  <div>
                    <h2>Where should we send it?</h2>
                    <p>A complete address helps us get it right.</p>
                  </div>
                </div>
                <label>
                  City
                  <input
                    required
                    maxLength={80}
                    autoComplete="address-level2"
                    placeholder="Your city"
                    value={store.customer.city}
                    onChange={(e) =>
                      store.setCustomer({
                        ...store.customer,
                        city: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Delivery address
                  <textarea
                    required
                    rows={3}
                    maxLength={400}
                    autoComplete="street-address"
                    placeholder="House, street, area and any helpful landmark"
                    value={store.customer.address}
                    onChange={(e) =>
                      store.setCustomer({
                        ...store.customer,
                        address: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Anything else we should know? <span>(optional)</span>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="A device model, question or delivery instruction…"
                    value={store.customer.notes}
                    onChange={(e) =>
                      store.setCustomer({
                        ...store.customer,
                        notes: e.target.value,
                      })
                    }
                  />
                </label>
              </section>
              <section className="sf-form-section sf-payment-section">
                <div className="sf-form-section-heading">
                  <span>03</span>
                  <div>
                    <h2>A personal confirmation.</h2>
                    <p>We’ll take it from here.</p>
                  </div>
                </div>
                <div className="sf-payment-note">
                  <MessageCircle size={23} />
                  <div>
                    <strong>Payment arranged with the store</strong>
                    <p>
                      We’ll contact you to confirm availability, delivery and
                      payment details. No online payment is taken today.
                    </p>
                  </div>
                  <CheckCircle2 size={19} />
                </div>
              </section>
            </fieldset>
            <ErrorNotice>{store.checkoutError}</ErrorNotice>
            {store.invalidCart && (
              <ErrorNotice>
                Availability has changed.{' '}
                <Link href="/cart">Review your bag</Link> before placing your
                order.
              </ErrorNotice>
            )}
            <button
              className="sf-button sf-button-dark sf-wide sf-place-order"
              type="submit"
              disabled={
                store.submitting ||
                store.checkingCoupon ||
                store.invalidCart ||
                store.loading ||
                !!store.error
              }
            >
              {store.submitting
                ? 'Placing your order…'
                : `Place order & WhatsApp · ${money(store.total)}`}
              <ArrowRight size={18} />
            </button>
            <p className="sf-checkout-privacy">
              <LockKeyhole size={14} /> Your order is saved with the store
              first. Then WhatsApp opens with your details ready to send.
            </p>
          </form>
          <aside className="sf-order-summary sf-checkout-summary">
            <div className="sf-summary-heading">
              <h2>
                In your bag <span>{store.count}</span>
              </h2>
              <Link href="/cart">
                Edit <ArrowUpRight size={13} />
              </Link>
            </div>
            <CartLines store={store} compact />
            <CouponField store={store} />
            <OrderTotals store={store} />
            <div className="sf-summary-delivery">
              <Truck size={19} />
              <span>
                {store.delivery
                  ? 'Rs. 250 delivery · free over Rs. 5,000'
                  : 'Free delivery unlocked. A little extra, on us.'}
              </span>
            </div>
            <div className="sf-summary-help">
              <span>Need a hand with your order?</span>
              <a href={whatsapp} target="_blank" rel="noreferrer">
                Ask us on WhatsApp <ArrowUpRight size={14} />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </CartGuard>
  )
}

export function ConfirmationPage({ store }) {
  const order = store.receipt
  if (!order)
    return (
      <div className="sf-container sf-purchase-empty">
        <EmptyState icon={ShoppingBag} title="Your next good thing awaits.">
          <p>Your order confirmation will appear here after checkout.</p>
          <Link className="sf-button sf-button-dark" href="/shop">
            Back to the store <ArrowRight size={17} />
          </Link>
        </EmptyState>
      </div>
    )
  const whatsappUrl = order.whatsappUrl || orderWhatsAppUrl(order)
  return (
    <div className="sf-container sf-confirmation">
      <div className="sf-confirmation-heading">
        <span className="sf-confirmation-check">
          <Check size={31} strokeWidth={1.5} />
        </span>
        <p className="sf-eyebrow">ORDER RECEIVED. GOOD THINGS AHEAD.</p>
        <h1>
          Thank you.
          <br />
          <em>We’re on it.</em>
        </h1>
        <p>
          Your order has been saved. Send the prepared WhatsApp message to share
          the details with us. If WhatsApp didn’t open, use the button below.
        </p>
        <span className="sf-order-reference">
          Your order reference <strong>{order.id}</strong>
        </span>
      </div>
      <div className="sf-confirmation-content">
        <div>
          <h2>Here’s what happens next.</h2>
          <ol className="sf-next-steps">
            <li>
              <span>01</span>
              <div>
                <h3>A quick confirmation</h3>
                <p>
                  We’ll check stock and get in touch using the phone number you
                  provided.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>The little details</h3>
                <p>We’ll confirm delivery arrangements and how to pay.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Good things, on their way</h3>
                <p>Once everything is agreed, we’ll arrange your order.</p>
              </div>
            </li>
          </ol>
          <a
            className="sf-button sf-button-dark"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} /> Send order on WhatsApp{' '}
            <ArrowUpRight size={16} />
          </a>
          <Link className="sf-text-link" href="/shop">
            Keep exploring <ArrowRight size={16} />
          </Link>
        </div>
        <aside className="sf-order-summary">
          <h2>Your order</h2>
          <div className="sf-receipt-items">
            {order.items.map((item) => (
              <div key={item.id}>
                <span>
                  {item.name}
                  <small>Qty. {item.quantity}</small>
                </span>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <OrderTotals store={order} />
          <p className="sf-summary-note">
            <ShieldCheck size={15} /> No payment has been collected online.
          </p>
        </aside>
      </div>
    </div>
  )
}
