import test from 'node:test'
import assert from 'node:assert/strict'
import { orderWhatsAppUrl } from '../src/order-whatsapp.js'

const order = {
  id: 'SE-123456ABCDEF',
  items: [{ id: 'router', name: 'Router & backup', quantity: 2, price: 2000 }],
  subtotal: 4000,
  delivery: 250,
  total: 4250,
}

test('WhatsApp order includes saved prices, reference, and encoded customer delivery details', () => {
  const url = new URL(
    orderWhatsAppUrl(order, {
      name: ' Test Customer ',
      phone: '+923001234567',
      city: 'Phool Nagar',
      address: 'House #5, A & B street',
      notes: 'Call first\nBlue gate',
    }),
  )
  assert.equal(url.origin + url.pathname, 'https://wa.me/923187083785')
  const message = url.searchParams.get('text')
  for (const value of [
    order.id,
    'Router & backup × 2 — Rs. 4,000',
    'Subtotal: Rs. 4,000',
    'Delivery: Rs. 250',
    '*Total: Rs. 4,250*',
    'Name: Test Customer',
    'Phone: +923001234567',
    'City: Phool Nagar',
    'Address: House #5, A & B street',
    'Notes: Call first\nBlue gate',
  ])
    assert.ok(message.includes(value), value)
  assert.equal([...url.searchParams.keys()].length, 1)
})

test('refreshed receipts can open WhatsApp without customer information and show free delivery', () => {
  const message = new URL(
    orderWhatsAppUrl({ ...order, delivery: 0, total: 4000 }),
  ).searchParams.get('text')
  assert.match(message, /Delivery: Free/)
  assert.match(message, /Total: Rs\. 4,000/)
  assert.doesNotMatch(
    message,
    /Delivery details|undefined|Name:|Phone:|Address:/,
  )
})

test('discounted orders include the saved code, discount, and final total', () => {
  const message = new URL(
    orderWhatsAppUrl({
      ...order,
      couponCode: 'WELCOME10',
      discount: 400,
      total: 3850,
    }),
  ).searchParams.get('text')
  assert.match(message, /Discount \(WELCOME10\): -Rs\. 400/)
  assert.match(message, /Total: Rs\. 3,850/)
})
