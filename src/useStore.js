import { useCallback, useEffect, useRef, useState } from 'react'
import { request } from './api'
import { orderWhatsAppUrl } from './order-whatsapp'

export const initialCustomer = {
  name: '',
  phone: '',
  city: '',
  address: '',
  notes: '',
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
function loadReceipt() {
  try {
    const receipt = JSON.parse(sessionStorage.getItem('se-last-receipt'))
    return receipt &&
      /^SE-[A-F0-9]{12}$/.test(receipt.id) &&
      Array.isArray(receipt.items) &&
      Number.isFinite(receipt.total)
      ? receipt
      : null
  } catch {
    return null
  }
}

export function useStore() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState(loadCart)
  const [customer, setCustomer] = useState(initialCustomer)
  const [receipt, setReceipt] = useState(loadReceipt)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [couponQuote, setCouponQuote] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const couponRequest = useRef(0)
  const couponCartKey = useRef('')
  const [toast, setToast] = useState('')
  const checkoutKey = useRef(null)
  const timer = useRef(null)
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProducts((await request('/products')).products)
    } catch (e) {
      setError(e.message)
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
      /* The bag still works when storage is unavailable. */
    }
  }, [cart])
  useEffect(() => () => clearTimeout(timer.current), [])
  function notify(message) {
    setToast(message)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(''), 4500)
  }
  function updateCart(id, quantity) {
    if (submitting) return
    removeCoupon()
    checkoutKey.current = null
    setCheckoutError('')
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) =>
            item.id === id ? { ...item, quantity } : item,
          ),
    )
  }
  function add(product, quantity = 1) {
    const existing = cart.find((item) => item.id === product.id)?.quantity || 0
    if (!existing && cart.length >= 30) {
      notify('Your bag can hold up to 30 different products.')
      return false
    }
    if (submitting || existing + quantity > Math.min(99, product.stock)) {
      notify('That quantity is not available. Please check your bag.')
      return false
    }
    removeCoupon()
    checkoutKey.current = null
    setCheckoutError('')
    setCart((current) =>
      current.some((item) => item.id === product.id)
        ? current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...current, { id: product.id, quantity }],
    )
    notify(`${product.name} added to your bag`)
    return true
  }
  const lines = cart.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.id),
  }))
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal =
    Math.round(
      lines.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity,
        0,
      ) * 100,
    ) / 100
  const delivery = subtotal > 5000 ? 0 : 250
  const cartKey = JSON.stringify(
    lines.map(({ id, quantity, product }) => [
      id,
      quantity,
      product?.price,
      product?.stock,
    ]),
  )
  couponCartKey.current = cartKey
  const appliedCoupon = couponQuote?.cartKey === cartKey ? couponQuote : null
  const discount = appliedCoupon?.discount || 0
  const invalidCart =
    !cart.length ||
    lines.some((item) => !item.product || item.quantity > item.product.stock)
  function removeCoupon() {
    if (submitting) return
    couponRequest.current++
    setCheckingCoupon(false)
    setCouponQuote(null)
    setCouponError('')
    setCheckoutError('')
    checkoutKey.current = null
  }
  async function applyCoupon(code) {
    if (submitting || checkingCoupon || invalidCart || loading || error) return
    const requestId = ++couponRequest.current
    setCheckingCoupon(true)
    setCouponError('')
    setCouponQuote(null)
    setCheckoutError('')
    checkoutKey.current = null
    try {
      const { quote } = await request('/coupon', {
        method: 'POST',
        body: { code, items: cart },
      })
      if (
        couponRequest.current !== requestId ||
        couponCartKey.current !== cartKey
      )
        return
      if (quote.subtotal !== subtotal) {
        setCouponError(
          'Prices changed. Review your bag and apply the coupon again.',
        )
        refresh()
        return
      }
      setCouponQuote({ ...quote, cartKey })
    } catch (e) {
      if (
        couponRequest.current === requestId &&
        couponCartKey.current === cartKey
      )
        setCouponError(e.message)
    } finally {
      if (couponRequest.current === requestId) setCheckingCoupon(false)
    }
  }
  async function placeOrder() {
    if (submitting || checkingCoupon || invalidCart || loading || error)
      return null
    setSubmitting(true)
    setCheckoutError('')
    checkoutKey.current ||= crypto.randomUUID()
    try {
      const { order } = await request('/orders', {
        method: 'POST',
        body: {
          items: cart,
          customer,
          checkoutKey: checkoutKey.current,
          couponCode: appliedCoupon?.couponCode || '',
        },
      })
      const receipt = {
        ...order,
        whatsappUrl: orderWhatsAppUrl(order, customer),
      }
      setReceipt(receipt)
      try {
        // Persist only the receipt. The WhatsApp URL contains delivery details.
        sessionStorage.setItem('se-last-receipt', JSON.stringify(order))
      } catch {
        /* The receipt stays available in memory. */
      }
      setCart([])
      setCouponQuote(null)
      setCouponError('')
      setCustomer(initialCustomer)
      checkoutKey.current = null
      refresh()
      return receipt
    } catch (e) {
      setCheckoutError(e.message)
      if (e.status === 409) {
        checkoutKey.current = null
        refresh()
      }
      return null
    } finally {
      setSubmitting(false)
    }
  }
  return {
    products,
    loading,
    error,
    refresh,
    cart,
    lines,
    count,
    subtotal,
    delivery,
    discount,
    couponCode: appliedCoupon?.couponCode || '',
    couponError,
    checkingCoupon,
    applyCoupon,
    removeCoupon,
    total: Math.round((subtotal - discount + delivery) * 100) / 100,
    invalidCart,
    updateCart,
    add,
    customer,
    setCustomer,
    submitting,
    checkoutError,
    placeOrder,
    receipt,
    toast,
    setToast,
  }
}
