export const DELIVERY_CHARGE = 250
export const FREE_DELIVERY_THRESHOLD = 5000
export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'shipped',
  'completed',
  'cancelled',
]

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function text(value, label, max = 200, required = true) {
  if (
    typeof value !== 'string' ||
    value.trim().length > max ||
    (required && !value.trim())
  ) {
    throw new HttpError(400, `Please enter a valid ${label}.`)
  }
  return value.trim()
}

export function validateProduct(body) {
  const name = text(body.name, 'product name', 100)
  const description = text(body.description, 'description', 600)
  const category = text(body.category, 'category', 60)
  const image = text(body.image || '', 'image URL', 1500, false)
  if (image && !/^\/images\/[a-zA-Z0-9/_.-]+$/.test(image)) {
    let url
    try {
      url = new URL(image)
    } catch {
      throw new HttpError(
        400,
        'Use a local /images/ path or an HTTPS image URL.',
      )
    }
    if (url.protocol !== 'https:')
      throw new HttpError(400, 'Image URLs must use HTTPS.')
  }
  if (
    typeof body.price !== 'number' ||
    !Number.isFinite(body.price) ||
    body.price < 1 ||
    body.price > 10000000 ||
    Number(body.price.toFixed(2)) !== body.price
  )
    throw new HttpError(
      400,
      'Enter a price between Rs. 1 and Rs. 10,000,000, with at most two decimal places.',
    )
  if (!Number.isInteger(body.stock) || body.stock < 0 || body.stock > 100000)
    throw new HttpError(
      400,
      'Stock must be a whole number between 0 and 100,000.',
    )
  if (typeof body.active !== 'boolean')
    throw new HttpError(400, 'Choose whether the product is visible.')
  return {
    name,
    description,
    category,
    image,
    price: body.price,
    stock: body.stock,
    active: body.active,
    badge: text(body.badge || '', 'badge', 40, false),
  }
}

export function normalizeCouponCode(value) {
  const code = text(value, 'coupon code', 32).toUpperCase()
  if (!/^[A-Z0-9_-]{3,32}$/.test(code))
    throw new HttpError(
      400,
      'Coupon codes need 3–32 letters, numbers, hyphens, or underscores.',
    )
  return code
}

export function validateCoupon(body) {
  const code = normalizeCouponCode(body.code)
  if (!['percentage', 'fixed'].includes(body.type))
    throw new HttpError(400, 'Choose a percentage or fixed discount.')
  const max = body.type === 'percentage' ? 100 : 10000000
  if (
    typeof body.value !== 'number' ||
    !Number.isFinite(body.value) ||
    body.value <= 0 ||
    body.value > max ||
    Number(body.value.toFixed(2)) !== body.value
  )
    throw new HttpError(
      400,
      `Enter a discount greater than 0 and no more than ${max}, with at most two decimal places.`,
    )
  const minSubtotal = body.minSubtotal ?? 0
  if (
    typeof minSubtotal !== 'number' ||
    !Number.isFinite(minSubtotal) ||
    minSubtotal < 0 ||
    minSubtotal > 10000000 ||
    Number(minSubtotal.toFixed(2)) !== minSubtotal
  )
    throw new HttpError(400, 'Enter a valid minimum order subtotal.')
  if (typeof body.active !== 'boolean')
    throw new HttpError(400, 'Choose whether the coupon is active.')
  return {
    code,
    type: body.type,
    value: body.value,
    minSubtotal,
    active: body.active,
  }
}

export function validateItems(value) {
  if (!Array.isArray(value) || !value.length || value.length > 30)
    throw new HttpError(
      400,
      'Your cart must contain between 1 and 30 products.',
    )
  const ids = new Set()
  return value.map((item) => {
    if (
      typeof item?.id !== 'string' ||
      !/^[a-zA-Z0-9-]{1,100}$/.test(item.id) ||
      ids.has(item.id)
    )
      throw new HttpError(
        400,
        'Your cart contains an invalid or duplicate product.',
      )
    ids.add(item.id)
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    )
      throw new HttpError(400, 'Choose between 1 and 99 of each product.')
    return { id: item.id, quantity: item.quantity }
  })
}

export function validateCheckout(body) {
  const customer = body.customer || {}
  const name = text(customer.name, 'name', 100)
  const phone = text(customer.phone, 'phone number', 25)
  if (
    !/^\+?[\d\s()-]{10,25}$/.test(phone) ||
    phone.replace(/\D/g, '').length < 10
  )
    throw new HttpError(400, 'Please enter a valid phone number.')
  const city = text(customer.city, 'city', 80)
  const address = text(customer.address, 'delivery address', 400)
  const notes = text(customer.notes || '', 'order note', 500, false)
  const items = validateItems(body.items)
  if (
    typeof body.checkoutKey !== 'string' ||
    !/^[a-f\d-]{36}$/i.test(body.checkoutKey)
  )
    throw new HttpError(400, 'Please refresh your cart and try again.')
  return {
    customer: { name, phone, city, address, notes },
    items,
    checkoutKey: body.checkoutKey,
    couponCode:
      body.couponCode === undefined || body.couponCode === ''
        ? ''
        : normalizeCouponCode(body.couponCode),
  }
}

export function calculateOrder(items, products, coupon = null) {
  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.id && p.active)
    if (!product)
      throw new HttpError(
        409,
        'An item is no longer available. Please refresh your cart.',
      )
    if (product.stock < item.quantity)
      throw new HttpError(
        409,
        `Only ${product.stock} of ${product.name} available. Please update your cart.`,
      )
    return {
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
    }
  })
  const subtotal =
    Math.round(
      lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100,
    ) / 100
  const delivery = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE
  if (coupon && !coupon.active)
    throw new HttpError(
      400,
      'This coupon is no longer available. Remove it or try another code.',
    )
  if (coupon && subtotal < coupon.minSubtotal)
    throw new HttpError(
      400,
      `This coupon needs a product subtotal of at least Rs. ${coupon.minSubtotal.toLocaleString('en-PK')}.`,
    )
  const subtotalCents = Math.round(subtotal * 100)
  const discountCents = coupon
    ? Math.min(
        subtotalCents,
        Math.round(
          coupon.type === 'percentage'
            ? (subtotalCents * coupon.value) / 100
            : coupon.value * 100,
        ),
      )
    : 0
  return {
    items: lines,
    subtotal,
    delivery,
    couponCode: coupon?.code || '',
    discount: discountCents / 100,
    total: (subtotalCents - discountCents + delivery * 100) / 100,
  }
}
