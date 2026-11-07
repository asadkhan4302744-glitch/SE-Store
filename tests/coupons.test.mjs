import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import {
  calculateOrder,
  normalizeCouponCode,
  validateCheckout,
  validateCoupon,
} from '../server/domain.mjs'

const product = {
  id: 'test',
  name: 'Test item',
  price: 2000,
  stock: 10,
  active: true,
}
const items = [{ id: 'test', quantity: 2 }]
const coupon = {
  code: 'WELCOME10',
  type: 'percentage',
  value: 10,
  minSubtotal: 0,
  active: true,
}

test('coupon configuration normalizes codes and rejects invalid discount rules', () => {
  assert.equal(normalizeCouponCode(' welcome10 '), 'WELCOME10')
  assert.deepEqual(validateCoupon({ ...coupon, code: ' welcome10 ' }), coupon)
  for (const change of [
    { code: { $ne: '' } },
    { code: 'bad code' },
    { code: 'a' },
    { type: 'other' },
    { value: 0 },
    { value: 101 },
    { value: NaN },
    { value: 0.001 },
    { value: '10' },
    { minSubtotal: -1 },
    { minSubtotal: Infinity },
    { minSubtotal: '100' },
    { active: 'true' },
  ])
    assert.throws(() => validateCoupon({ ...coupon, ...change }), {
      status: 400,
    })
})

test('percentage discounts use stored item prices with currency rounding', () => {
  const order = calculateOrder(items, [product], coupon)
  assert.equal(order.subtotal, 4000)
  assert.equal(order.discount, 400)
  assert.equal(order.total, 3850)
  assert.equal(order.couponCode, coupon.code)
  const rounded = calculateOrder(
    [{ id: 'test', quantity: 3 }],
    [{ ...product, price: 10.1 }],
    { ...coupon, value: 12.5 },
  )
  assert.equal(rounded.discount, 3.79)
  assert.equal(rounded.total, 276.51)
})

test('fixed discounts cannot exceed product subtotal or discount delivery', () => {
  const order = calculateOrder(items, [product], {
    ...coupon,
    type: 'fixed',
    value: 10000,
  })
  assert.equal(order.discount, 4000)
  assert.equal(order.delivery, 250)
  assert.equal(order.total, 250)
})

test('minimum subtotal and active status are enforced; free delivery still uses original subtotal', () => {
  for (const change of [{ active: false }, { minSubtotal: 4001 }])
    assert.throws(
      () => calculateOrder(items, [product], { ...coupon, ...change }),
      { status: 400 },
    )
  assert.equal(
    calculateOrder(items, [product], { ...coupon, minSubtotal: 4000 }).discount,
    400,
  )
  const free = calculateOrder([{ id: 'test', quantity: 3 }], [product], {
    ...coupon,
    value: 50,
  })
  assert.equal(free.delivery, 0)
  assert.equal(free.total, 3000)
  assert.equal(calculateOrder(items, [product]).discount, 0)
})

test('checkout accepts only the coupon code and discards claimed discounts', () => {
  const input = {
    items,
    checkoutKey: randomUUID(),
    customer: {
      name: 'Test Customer',
      phone: '03001234567',
      city: 'Test City',
      address: 'Test address',
    },
    couponCode: ' welcome10 ',
    discount: 99999,
    total: 1,
  }
  const checkout = validateCheckout(input)
  assert.equal(checkout.couponCode, 'WELCOME10')
  assert.equal(checkout.discount, undefined)
  assert.equal(checkout.total, undefined)
  assert.throws(
    () => validateCheckout({ ...input, couponCode: { $ne: null } }),
    { status: 400 },
  )
})
