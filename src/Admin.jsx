import React, { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Edit3,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react'
import { request, money } from './api'
import {
  Brand,
  Dialog,
  EmptyState,
  ErrorNotice,
  ProductMedia,
} from './components'

const blankProduct = {
  name: '',
  category: 'Power & Backup',
  description: '',
  price: '',
  stock: '',
  image: '',
  badge: '',
  active: true,
}
const statuses = ['new', 'confirmed', 'shipped', 'completed', 'cancelled']
const date = (value) =>
  new Date(value).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Karachi',
  })

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request('/admin/login', {
        method: 'POST',
        body: { email, password },
      })
      setPassword('')
      onLogin(result.email)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="login-page">
      <div className="login-brand">
        <Brand />
      </div>
      <div className="login-card">
        <span className="login-lock">
          <LockKeyhole size={25} strokeWidth={1.5} />
        </span>
        <p className="eyebrow">THE STORE, BEHIND THE SCENES</p>
        <h1>
          Welcome back<span>.</span>
        </h1>
        <p>Sign in to take care of your products and orders.</p>
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              data-autofocus
              type="email"
              autoComplete="username"
              required
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                maxLength={200}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
              <button
                className="icon-button"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          <ErrorNotice>{error}</ErrorNotice>
          <button className="button button-dark full-width" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            <ArrowRight size={17} />
          </button>
        </form>
        <a href="/" className="login-back">
          <ArrowLeft size={15} /> Back to the store
        </a>
      </div>
      <p className="login-footer">Shahzad Electronics · Store administration</p>
    </main>
  )
}

function ProductEditor({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product || blankProduct)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))
  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await request(
        product ? `/admin/products/${product.id}` : '/admin/products',
        {
          method: product ? 'PUT' : 'POST',
          body: {
            ...form,
            price: Number(form.price),
            stock: Number(form.stock),
          },
        },
      )
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      title={product ? 'Edit product' : 'A new everyday essential'}
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <form className="product-form" onSubmit={save}>
        <fieldset disabled={busy}>
          <label>
            Product name
            <input
              data-autofocus
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
              placeholder="e.g. 12V Router Power Bank"
            />
          </label>
          <div className="form-row">
            <label>
              Price (Rs.)
              <input
                required
                type="number"
                min="1"
                max="10000000"
                step="0.01"
                value={form.price}
                onChange={(e) => field('price', e.target.value)}
                placeholder="2000"
              />
            </label>
            <label>
              Stock quantity
              <input
                required
                type="number"
                min="0"
                max="100000"
                step="1"
                value={form.stock}
                onChange={(e) => field('stock', e.target.value)}
                placeholder="25"
              />
            </label>
          </div>
          <label>
            Category
            <input
              required
              maxLength={60}
              list="product-categories"
              value={form.category}
              onChange={(e) => field('category', e.target.value)}
            />
            <datalist id="product-categories">
              {[
                'Power & Backup',
                'Lighting',
                'Switches & Sockets',
                'Wiring & Cables',
                'Networking',
                'Security',
                'Accessories',
                'Bundles',
                'Other Electronics',
              ].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            Description
            <textarea
              required
              rows={3}
              maxLength={600}
              value={form.description}
              onChange={(e) => field('description', e.target.value)}
              placeholder="What makes this product useful?"
            />
          </label>
          <label>
            Image URL
            <input
              maxLength={1500}
              value={form.image}
              onChange={(e) => field('image', e.target.value)}
              placeholder="https://… or /images/your-image.png"
            />
            <small>
              Use an HTTPS image link or a file in public/images. Leave blank
              for a simple placeholder.
            </small>
          </label>
          <label>
            Badge <span>(optional)</span>
            <input
              maxLength={40}
              value={form.badge}
              onChange={(e) => field('badge', e.target.value)}
              placeholder="e.g. Featured or New arrival"
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => field('active', e.target.checked)}
            />
            <span>
              <strong>Visible in the store</strong>
              <small>
                Turn off to archive this product. Existing orders stay intact.
              </small>
            </span>
          </label>
        </fieldset>
        <ErrorNotice>{error}</ErrorNotice>
        <div className="dialog-actions">
          <button
            className="button button-outline"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button button-dark" disabled={busy}>
            {busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function OrderDetails({ order, onClose, onStatus }) {
  const [status, setStatus] = useState(order.status)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function update(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await request(`/admin/orders/${order.id}`, {
        method: 'PATCH',
        body: { status },
      })
      onStatus(data.order)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      title={order.id}
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <div className="order-detail-top">
        <span>Placed {date(order.createdAt)}</span>
        <span className={`status-badge status-${order.status}`}>
          {order.status}
        </span>
      </div>
      <div className="customer-card">
        <p className="eyebrow">CUSTOMER & DELIVERY</p>
        <h3>{order.customer.name}</h3>
        <a href={`tel:${order.customer.phone.replace(/[^\d+]/g, '')}`}>
          {order.customer.phone}
        </a>
        <p>
          {order.customer.address}
          <br />
          {order.customer.city}
        </p>
        {order.customer.notes && (
          <div className="customer-note">
            <strong>Order note</strong>
            <p>{order.customer.notes}</p>
          </div>
        )}
      </div>
      <div className="order-detail-items">
        {order.items.map((item) => (
          <div key={item.id}>
            <ProductMedia product={item} />
            <span>
              <strong>{item.name}</strong>
              <small>
                {money(item.price)} × {item.quantity}
              </small>
            </span>
            <strong>{money(item.price * item.quantity)}</strong>
          </div>
        ))}
      </div>
      <div className="order-totals">
        <div>
          <span>Subtotal</span>
          <strong>{money(order.subtotal)}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>{order.delivery ? money(order.delivery) : 'Free'}</strong>
        </div>
        <div className="total-row">
          <span>Total</span>
          <strong>{money(order.total)}</strong>
        </div>
      </div>
      {['cancelled', 'completed'].includes(order.status) ? (
        <p className="form-note">
          This order is {order.status}.{' '}
          {order.status === 'cancelled' &&
            'Its items have been returned to stock.'}
        </p>
      ) : (
        <form className="status-form" onSubmit={update}>
          <label>
            Order status
            <select
              aria-label="Order status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={busy}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
          {status === 'cancelled' && (
            <p className="cancel-note">
              Cancelling will return all items to stock. This cannot be undone.
            </p>
          )}
          <ErrorNotice>{error}</ErrorNotice>
          <button
            className="button button-dark full-width"
            disabled={busy || status === order.status}
          >
            {busy ? 'Updating…' : 'Update order'}
            <CheckCircle2 size={16} />
          </button>
        </form>
      )}
    </Dialog>
  )
}

export default function Admin() {
  const [email, setEmail] = useState(null)
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editor, setEditor] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    document.title = 'Store Admin — Shahzad Electronics'
    request('/admin/session')
      .then((data) => setEmail(data.email))
      .catch((e) => {
        if (e.status !== 401) setError(e.message)
      })
      .finally(() => setChecking(false))
  }, [])
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, o] = await Promise.all([
        request('/admin/products'),
        request('/admin/orders'),
      ])
      setProducts(p.products)
      setOrders(o.orders)
    } catch (e) {
      if (e.status === 401) setEmail(null)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    if (email) refresh()
  }, [email, refresh])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 4000)
    return () => clearTimeout(timer)
  }, [message])
  async function logout() {
    try {
      await request('/admin/logout', { method: 'POST', body: {} })
      setEmail(null)
      setOrders([])
      setProducts([])
    } catch (e) {
      if (e.status === 401) setEmail(null)
      else setError(e.message)
    }
  }
  if (checking)
    return (
      <div className="admin-check">
        <Brand />
        <p>Opening your store…</p>
      </div>
    )
  if (!email) return <Login onLogin={setEmail} />
  const newOrders = orders.filter((o) => o.status === 'new').length
  const activeProducts = products.filter((p) => p.active).length
  const revenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0)
  const visibleOrders = orders.filter(
    (o) =>
      (statusFilter === 'all' || o.status === statusFilter) &&
      `${o.id} ${o.customer.name} ${o.customer.phone} ${o.customer.city}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const visibleProducts = products.filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  )
  function switchTab(next) {
    setTab(next)
    setQuery('')
    setStatusFilter('all')
  }
  const ordersTable = (list) =>
    list.length ? (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th>
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((order) => (
              <tr key={order.id}>
                <td>
                  <button
                    className="table-link"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {order.id}
                  </button>
                  <small>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                    items
                  </small>
                </td>
                <td>
                  <strong>{order.customer.name}</strong>
                  <small>{order.customer.city}</small>
                </td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td className="table-price">{money(order.total)}</td>
                <td className="table-date">{date(order.createdAt)}</td>
                <td>
                  <button
                    className="icon-button"
                    onClick={() => setSelectedOrder(order)}
                    aria-label={`View order ${order.id}`}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState
        icon={ShoppingBag}
        title={
          query || statusFilter !== 'all'
            ? 'No matching orders.'
            : 'Your next order starts here.'
        }
      >
        <p>
          {query || statusFilter !== 'all'
            ? 'Try a different search or status.'
            : 'When a customer places an order, it will appear here.'}
        </p>
      </EmptyState>
    )
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand />
        <p className="sidebar-label">STORE WORKSPACE</p>
        <nav aria-label="Admin navigation">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => switchTab(id)}
            >
              <Icon size={18} />
              {label}
              {id === 'orders' && newOrders > 0 && <b>{newOrders}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            View storefront <ArrowUpRight size={16} />
          </a>
          <div className="admin-user">
            <span>{email[0].toUpperCase()}</span>
            <div>
              <strong>Store admin</strong>
              <small>{email}</small>
            </div>
            <button
              className="icon-button"
              onClick={logout}
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span>
            Shahzad Electronics{' '}
            <span className="breadcrumb">
              / {tab[0].toUpperCase() + tab.slice(1)}
            </span>
          </span>
          <span className="workspace-badge">
            <span /> Store workspace
          </span>
          <button
            className="mobile-logout icon-button"
            onClick={logout}
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </header>
        <main className="admin-main">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">
                {tab === 'overview'
                  ? 'A LITTLE LOOK AT THE BIG PICTURE'
                  : 'KEEP THINGS RUNNING SMOOTHLY'}
              </p>
              <h1>
                {tab === 'overview'
                  ? 'Your store, at a glance.'
                  : tab === 'products'
                    ? 'The product shelf.'
                    : 'Orders & deliveries.'}
              </h1>
              <p>
                {tab === 'overview'
                  ? 'A simple space to take care of business.'
                  : tab === 'products'
                    ? 'Add essentials, update prices, and keep stock in check.'
                    : 'From a new order to a happy doorstep.'}
              </p>
            </div>
            <div className="admin-heading-actions">
              <button
                className="icon-button refresh-button"
                onClick={refresh}
                disabled={loading}
                aria-label="Refresh store data"
              >
                <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              </button>
              {tab !== 'orders' && (
                <button
                  className="button button-dark"
                  onClick={() => setEditor({ type: 'new' })}
                >
                  <Plus size={16} /> Add product
                </button>
              )}
            </div>
          </div>
          <ErrorNotice>{error}</ErrorNotice>
          {loading && !products.length && !orders.length ? (
            <div className="admin-loading">Loading your store…</div>
          ) : (
            <>
              {tab === 'overview' && (
                <>
                  <div className="stat-grid">
                    <article>
                      <span>
                        Completed order value <CheckCircle2 size={17} />
                      </span>
                      <strong>{money(revenue)}</strong>
                      <small>Includes delivery · completed orders only</small>
                    </article>
                    <article>
                      <span>
                        Orders to review <ShoppingBag size={17} />
                      </span>
                      <strong>{newOrders.toString().padStart(2, '0')}</strong>
                      <small>New orders waiting for confirmation</small>
                    </article>
                    <article>
                      <span>
                        On the shelf <Package size={17} />
                      </span>
                      <strong>
                        {activeProducts.toString().padStart(2, '0')}
                      </strong>
                      <small>
                        {
                          products.filter((p) => p.active && p.stock === 0)
                            .length
                        }{' '}
                        out of stock · {products.length - activeProducts}{' '}
                        archived
                      </small>
                    </article>
                  </div>
                  <section className="admin-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Recent orders</h2>
                        <p>The latest from your customers.</p>
                      </div>
                      <button
                        className="text-link"
                        onClick={() => switchTab('orders')}
                      >
                        All orders <ArrowRight size={15} />
                      </button>
                    </div>
                    {ordersTable(orders.slice(0, 5))}
                  </section>
                  <div className="admin-tip">
                    <span>
                      <Truck size={23} />
                    </span>
                    <div>
                      <strong>A quick reminder</strong>
                      <p>
                        Delivery is Rs. 250, and free on orders over Rs. 5,000.
                        Cancelling an order returns its items to stock.
                      </p>
                    </div>
                  </div>
                  <p className="admin-data-note">
                    Overview reflects the latest 500 orders.
                  </p>
                </>
              )}
              {tab === 'products' && (
                <section className="admin-panel">
                  <div className="panel-heading">
                    <h2>
                      All products{' '}
                      <span className="count-label">{products.length}</span>
                    </h2>
                    <label className="search-field">
                      <Search size={16} />
                      <input
                        aria-label="Search admin products"
                        placeholder="Search products…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  {visibleProducts.length ? (
                    <div className="table-scroll">
                      <table className="products-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Visibility</th>
                            <th>
                              <span className="sr-only">Edit</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleProducts.map((product) => (
                            <tr key={product.id}>
                              <td>
                                <div className="table-product">
                                  <ProductMedia product={product} />
                                  <button
                                    className="table-link"
                                    onClick={() =>
                                      setEditor({ type: 'edit', product })
                                    }
                                  >
                                    {product.name}
                                  </button>
                                </div>
                              </td>
                              <td>{product.category}</td>
                              <td className="table-price">
                                {money(product.price)}
                              </td>
                              <td>
                                <span
                                  className={
                                    product.stock <= 5 ? 'low-stock' : ''
                                  }
                                >
                                  {product.stock} available
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`visibility-badge ${product.active ? 'visible' : ''}`}
                                >
                                  {product.active ? (
                                    <Eye size={12} />
                                  ) : (
                                    <EyeOff size={12} />
                                  )}
                                  {product.active ? 'Visible' : 'Archived'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="icon-button"
                                  onClick={() =>
                                    setEditor({ type: 'edit', product })
                                  }
                                  aria-label={`Edit ${product.name}`}
                                >
                                  <Edit3 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState
                      icon={Package}
                      title={
                        query
                          ? 'No matching products.'
                          : 'A fresh shelf awaits.'
                      }
                    >
                      <p>
                        {query
                          ? 'Try another name or category.'
                          : 'Add your first product to start selling.'}
                      </p>
                    </EmptyState>
                  )}
                </section>
              )}
              {tab === 'orders' && (
                <section className="admin-panel">
                  <div className="panel-heading">
                    <h2>
                      All orders{' '}
                      <span className="count-label">{orders.length}</span>
                    </h2>
                    <div className="order-filters">
                      <label className="search-field">
                        <Search size={16} />
                        <input
                          aria-label="Search orders"
                          placeholder="Name, order or city…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <label className="select-filter">
                        <span className="sr-only">Filter by order status</span>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All statuses</option>
                          {statuses.map((s) => (
                            <option value={s} key={s}>
                              {s[0].toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} />
                      </label>
                    </div>
                  </div>
                  {ordersTable(visibleOrders)}
                  <p className="admin-data-note">
                    Showing the most recent 500 orders.
                  </p>
                </section>
              )}
            </>
          )}
        </main>
        <div className="admin-footer">
          Shahzad Electronics <span>A little order behind the everyday.</span>
        </div>
      </div>
      {editor && (
        <ProductEditor
          product={editor.product}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null)
            setMessage('Product saved. Your store is up to date.')
            refresh()
          }}
        />
      )}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatus={(order) => {
            setSelectedOrder(order)
            setMessage('Order updated.')
            refresh()
          }}
        />
      )}
      {message && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button aria-label="Dismiss message" onClick={() => setMessage('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
