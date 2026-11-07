import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import 'dotenv/config'

test(
  'MongoDB API: protected administration, product lifecycle, checkout, stock and session revocation',
  { skip: process.env.SE_STORE_INTEGRATION !== '1', timeout: 90000 },
  async (t) => {
    // Always isolate integration data. Never delete or test against the configured store database.
    process.env.MONGODB_DB = `se_store_test_${randomUUID().replaceAll('-', '').slice(0, 16)}`
    // Test authentication with isolated credentials, independently of the owner's .env password.
    process.env.ADMIN_EMAIL = 'integration@se-store.test'
    // A short fixture guards against accidentally reintroducing a length restriction.
    process.env.ADMIN_PASSWORD = randomUUID().slice(0, 8)
    const { default: api } = await import('../api/[...route].js')
    const { default: adminApi } = await import('../api/admin/[action].js')
    const { default: productApi } =
      await import('../api/admin/products/[id].js')
    const { default: orderApi } = await import('../api/admin/orders/[id].js')
    const { database, closeDatabase } = await import('../server/database.mjs')
    // Exercise the actual Vercel entry files at their corresponding path depths.
    const server = http.createServer((req, res) => {
      const path = new URL(req.url, 'http://localhost').pathname
      if (path.startsWith('/api/admin/products/')) return productApi(req, res)
      if (path.startsWith('/api/admin/orders/')) return orderApi(req, res)
      if (path.startsWith('/api/admin/')) return adminApi(req, res)
      return api(req, res)
    })
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
      assert.equal((await call('/admin/coupons')).response.status, 401)
      assert.equal(
        (await call('/admin/coupons', 'POST', { code: 'TEST10' })).response
          .status,
        401,
      )
      assert.equal(
        (await call('/admin/upload-image', 'POST', { image: '' })).response
          .status,
        401,
      )
      const configuredPassword = process.env.ADMIN_PASSWORD
      try {
        delete process.env.ADMIN_PASSWORD
        assert.equal(
          (
            await call('/admin/login', 'POST', {
              email: process.env.ADMIN_EMAIL,
              password: configuredPassword,
            })
          ).response.status,
          503,
        )
      } finally {
        process.env.ADMIN_PASSWORD = configuredPassword
      }
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
      // Exercise the nested Vercel upload route without uploading to a real account.
      assert.equal(
        (
          await call('/admin/upload-image', 'POST', {
            image: 'https://example.com/photo.png',
          })
        ).response.status,
        400,
      )
      const { v2: cloudinary } = await import('cloudinary')
      const cloudinaryKeys = [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
      ]
      const savedCloudinary = cloudinaryKeys.map((key) => process.env[key])
      t.after(() =>
        cloudinaryKeys.forEach((key, i) => {
          if (savedCloudinary[i] === undefined) delete process.env[key]
          else process.env[key] = savedCloudinary[i]
        }),
      )
      cloudinaryKeys.forEach((key) => {
        process.env[key] = 'integration-test'
      })
      const upload = t.mock.method(cloudinary.uploader, 'upload', async () => ({
        secure_url:
          'https://res.cloudinary.com/integration-test/image/upload/test.webp',
      }))
      const uploaded = await call('/admin/upload-image', 'POST', {
        image:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      })
      assert.equal(uploaded.response.status, 201)
      assert.equal(upload.mock.callCount(), 1)
      const tooLarge = await call('/admin/upload-image', 'POST', {
        image: 'x'.repeat(4 * 1024 * 1024 + 1024),
      })
      assert.equal(tooLarge.response.status, 413)
      assert.equal(upload.mock.callCount(), 1)
      const created = await call('/admin/products', 'POST', {
        name: 'Test LED',
        description: 'Integration test fixture',
        category: 'Lighting',
        price: 1000,
        stock: 3,
        image: uploaded.data.image,
        badge: '',
        active: true,
      })
      assert.equal(created.response.status, 201)
      const product = created.data.product
      assert.equal(product.image, uploaded.data.image)
      const coupon = {
        code: ' test10 ',
        type: 'percentage',
        value: 10,
        minSubtotal: 2000,
        active: true,
      }
      assert.equal(
        (await call('/admin/coupons', 'POST', coupon)).response.status,
        201,
      )
      assert.equal(
        (await call('/admin/coupons', 'POST', coupon)).response.status,
        409,
      )
      assert.equal(
        (await call('/admin/coupons')).data.coupons[0].code,
        'TEST10',
      )
      const quote = await call(
        '/coupon',
        'POST',
        {
          code: 'test10',
          items: [{ id: product.id, quantity: 2, price: 1 }],
          discount: 9999,
        },
        false,
      )
      assert.equal(quote.response.status, 200)
      assert.equal(quote.data.quote.discount, 200)
      assert.equal(quote.data.quote.total, 2050)
      for (const code of ['MISSING', { $ne: null }])
        assert.equal(
          (
            await call(
              '/coupon',
              'POST',
              { code, items: [{ id: product.id, quantity: 2 }] },
              false,
            )
          ).response.status,
          400,
        )
      assert.equal(
        (
          await call(
            '/coupon',
            'POST',
            { code: 'test10', items: [{ id: product.id, quantity: 1 }] },
            false,
          )
        ).response.status,
        400,
      )
      assert.equal(
        (await call('/admin/coupons', 'PUT', { ...coupon, active: false }))
          .response.status,
        200,
      )
      assert.equal(
        (
          await call(
            '/coupon',
            'POST',
            { code: 'test10', items: [{ id: product.id, quantity: 2 }] },
            false,
          )
        ).response.status,
        400,
      )
      assert.ok(
        (await call('/products')).data.products.some(
          (p) => p.id === product.id,
        ),
      )
      const checkout = {
        checkoutKey: randomUUID(),
        couponCode: 'test10',
        discount: 9999,
        total: 1,
        items: [{ id: product.id, quantity: 2, price: 1 }],
        customer: {
          name: 'QA Customer',
          phone: '03001234567',
          city: 'Test City',
          address: 'Test address',
          notes: '',
        },
      }
      // A coupon disabled since preview cannot be used to reserve stock.
      assert.equal(
        (await call('/orders', 'POST', checkout, false)).response.status,
        400,
      )
      assert.equal(
        (await call('/products')).data.products.find((p) => p.id === product.id)
          .stock,
        3,
      )
      await call('/admin/coupons', 'PUT', { ...coupon, active: true })
      const placed = await call('/orders', 'POST', checkout, false)
      assert.equal(placed.response.status, 201, JSON.stringify(placed.data))
      assert.equal(placed.data.order.total, 2050)
      assert.equal(placed.data.order.discount, 200)
      assert.equal(placed.data.order.couponCode, 'TEST10')
      assert.equal(placed.data.order.customer, undefined)
      // Idempotent retries preserve the saved discount even after a code is disabled.
      await call('/admin/coupons', 'PUT', { ...coupon, active: false })
      const retry = await call('/orders', 'POST', checkout, false)
      assert.equal(retry.data.order.id, placed.data.order.id)
      assert.equal(retry.data.order.discount, 200)
      assert.equal(retry.data.order.total, 2050)
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
            { ...checkout, checkoutKey: randomUUID(), couponCode: '' },
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
