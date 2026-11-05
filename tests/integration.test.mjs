import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import 'dotenv/config'

test(
  'MongoDB API: protected administration, product lifecycle, checkout, stock and session revocation',
  { skip: process.env.SE_STORE_INTEGRATION !== '1', timeout: 90000 },
  async () => {
    // Always isolate integration data. Never delete or test against the configured store database.
    process.env.MONGODB_DB = `se_store_test_${randomUUID().replaceAll('-', '').slice(0, 16)}`
    const { default: api } = await import('../server/api.mjs')
    const { database, closeDatabase } = await import('../server/database.mjs')
    const server = http.createServer(api)
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${server.address().port}/api`
    let cookie = ''
    async function call(path, method = 'GET', body, authenticated = true) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(authenticated && cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      return { response, data: await response.json() }
    }
    try {
      assert.equal((await call('/admin/products')).response.status, 401)
      assert.equal(
        (
          await call('/admin/login', 'POST', {
            email: process.env.ADMIN_EMAIL,
            password: 'wrong',
          })
        ).response.status,
        401,
      )
      const login = await call('/admin/login', 'POST', {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      })
      assert.equal(login.response.status, 200)
      assert.match(
        login.response.headers.get('set-cookie'),
        /HttpOnly; SameSite=Strict/,
      )
      cookie = login.response.headers.get('set-cookie').split(';')[0]
      assert.equal(
        (await call('/admin/session')).data.email,
        process.env.ADMIN_EMAIL,
      )
      const created = await call('/admin/products', 'POST', {
        name: 'Test LED',
        description: 'Integration test fixture',
        category: 'Lighting',
        price: 1000,
        stock: 3,
        image: '',
        badge: '',
        active: true,
      })
      assert.equal(created.response.status, 201)
      const product = created.data.product
      assert.ok(
        (await call('/products')).data.products.some(
          (p) => p.id === product.id,
        ),
      )
      const checkout = {
        checkoutKey: randomUUID(),
        items: [{ id: product.id, quantity: 2, price: 1 }],
        customer: {
          name: 'QA Customer',
          phone: '03001234567',
          city: 'Test City',
          address: 'Test address',
          notes: '',
        },
      }
      const placed = await call('/orders', 'POST', checkout, false)
      assert.equal(placed.response.status, 201, JSON.stringify(placed.data))
      assert.equal(placed.data.order.total, 2250)
      assert.equal(placed.data.order.customer, undefined)
      const retry = await call('/orders', 'POST', checkout, false)
      assert.equal(retry.data.order.id, placed.data.order.id)
      assert.equal(
        (await call('/products')).data.products.find((p) => p.id === product.id)
          .stock,
        1,
      )
      assert.equal(
        (
          await call(
            '/orders',
            'POST',
            { ...checkout, checkoutKey: randomUUID() },
            false,
          )
        ).response.status,
        409,
      )
      const cancel = await call(
        `/admin/orders/${placed.data.order.id}`,
        'PATCH',
        { status: 'cancelled' },
      )
      assert.equal(cancel.response.status, 200)
      assert.equal(
        (await call('/products')).data.products.find((p) => p.id === product.id)
          .stock,
        3,
      )
      await call(`/admin/orders/${placed.data.order.id}`, 'PATCH', {
        status: 'cancelled',
      })
      assert.equal(
        (await call('/products')).data.products.find((p) => p.id === product.id)
          .stock,
        3,
      )
      assert.equal(
        (
          await call(`/admin/orders/${placed.data.order.id}`, 'PATCH', {
            status: 'new',
          })
        ).response.status,
        409,
      )
      const edited = await call(`/admin/products/${product.id}`, 'PUT', {
        ...product,
        active: false,
      })
      assert.equal(edited.response.status, 200)
      assert.ok(
        !(await call('/products')).data.products.some(
          (p) => p.id === product.id,
        ),
      )
      assert.equal((await call('/admin/orders')).data.orders.length, 1)
      const crossOrigin = await fetch(`${base}/admin/logout`, {
        method: 'POST',
        headers: { Cookie: cookie, Origin: 'https://evil.example' },
      })
      assert.equal(crossOrigin.status, 403)
      assert.equal((await call('/admin/logout', 'POST')).response.status, 200)
      assert.equal((await call('/admin/session')).response.status, 401)
    } finally {
      try {
        const { db } = await database()
        assert.match(db.databaseName, /^se_store_test_/)
        await db.dropDatabase()
      } finally {
        await closeDatabase().catch(() => {})
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
      }
    }
  },
)
