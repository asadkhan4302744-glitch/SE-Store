import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import {
  calculateOrder,
  validateCheckout,
  validateProduct,
} from '../server/domain.mjs'

const product = {
  id: 'test-power-bank',
  name: 'Power Bank',
  description: 'A useful backup.',
  category: 'Power & Backup',
  image: '/images/router-power-bank-hero.png',
  price: 2000,
  stock: 5,
  active: true,
}
const checkout = () => ({
  checkoutKey: randomUUID(),
  customer: {
    name: 'Test Customer',
    phone: '03001234567',
    city: 'Phool Nagar',
    address: 'Test street',
    notes: '',
  },
  items: [{ id: product.id, quantity: 1 }],
})

test('calculates prices from stored products, ignoring client-supplied prices', () => {
  const order = calculateOrder(
    [{ id: product.id, quantity: 2, price: 1 }],
    [product],
  )
  assert.equal(order.subtotal, 4000)
  assert.equal(order.delivery, 250)
  assert.equal(order.total, 4250)
})
test('free delivery applies strictly above Rs. 5,000', () => {
  const products = [{ ...product, price: 5000 }]
  assert.equal(
    calculateOrder([{ id: product.id, quantity: 1 }], products).delivery,
    250,
  )
  assert.equal(
    calculateOrder([{ id: product.id, quantity: 2 }], products).delivery,
    0,
  )
})
test('rejects unavailable, archived and out-of-stock items', () => {
  for (const products of [
    [],
    [{ ...product, active: false }],
    [{ ...product, stock: 0 }],
  ])
    assert.throws(
      () => calculateOrder([{ id: product.id, quantity: 1 }], products),
      { status: 409 },
    )
})
test('handles currency arithmetic without accumulating floating point totals', () => {
  assert.equal(
    calculateOrder(
      [{ id: product.id, quantity: 3 }],
      [{ ...product, price: 10.1 }],
    ).total,
    280.3,
  )
})
test('checkout validates customer details and returns only permitted fields', () => {
  const body = checkout()
  body.customer.role = 'admin'
  body.customer.name = '  Test Customer  '
  const result = validateCheckout(body)
  assert.equal(result.customer.name, 'Test Customer')
  assert.equal(result.customer.role, undefined)
  assert.throws(
    () =>
      validateCheckout({
        ...body,
        customer: { ...body.customer, phone: 'abc' },
      }),
    { status: 400 },
  )
})
test('checkout rejects duplicate products, invalid quantities and malformed requests', () => {
  const body = checkout()
  for (const items of [
    [],
    [body.items[0], body.items[0]],
    [{ id: product.id, quantity: -1 }],
    [{ id: product.id, quantity: 1.5 }],
    [{ id: product.id, quantity: 100 }],
    [{ id: { $ne: null }, quantity: 1 }],
  ])
    assert.throws(() => validateCheckout({ ...body, items }), { status: 400 })
  assert.throws(() => validateCheckout({ ...body, checkoutKey: 'bad' }), {
    status: 400,
  })
})
test('products accept HTTPS images, local assets, or a placeholder', () => {
  for (const image of [product.image, 'https://example.com/photo.png', ''])
    assert.equal(validateProduct({ ...product, image }).image, image)
})
test('accepts valid decimal prices without floating point rounding rejection', () => {
  assert.equal(validateProduct({ ...product, price: 1.1 }).price, 1.1)
  assert.throws(() => validateProduct({ ...product, price: 1.123 }), {
    status: 400,
  })
})
test('product validation rejects unsafe image schemes and invalid inventory', () => {
  for (const image of [
    'javascript:alert(1)',
    'data:image/svg+xml,test',
    'http://example.com/a.png',
    '//example.com/a.png',
  ])
    assert.throws(() => validateProduct({ ...product, image }), { status: 400 })
  for (const values of [
    { price: -1 },
    { price: NaN },
    { stock: -1 },
    { stock: 1.2 },
    { active: 'true' },
  ])
    assert.throws(() => validateProduct({ ...product, ...values }), {
      status: 400,
    })
})
