import 'dotenv/config'
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto'
import { database } from './database.mjs'
import { MAX_IMAGE_REQUEST_BYTES, uploadProductImage } from './media.mjs'
import {
  calculateOrder,
  HttpError,
  ORDER_STATUSES,
  validateCheckout,
  validateProduct,
} from './domain.mjs'

const hash = (value) => createHash('sha256').update(value).digest('hex')
const publicProduct = ({ _id, ...product }) => product
const publicOrder = ({ _id, checkoutKey, ...order }) => order
const equal = (a, b) =>
  timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)))

function send(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(data))
}

async function readBody(req, maxBytes = 24000) {
  if (!req.headers['content-type']?.includes('application/json'))
    throw new HttpError(415, 'Send JSON data.')
  // Vercel may parse the JSON body before calling a Node function.
  if (req.body && typeof req.body === 'object') {
    if (Array.isArray(req.body))
      throw new HttpError(400, 'The request contains invalid JSON.')
    if (Buffer.byteLength(JSON.stringify(req.body)) > maxBytes)
      throw new HttpError(413, 'This request is too large.')
    return req.body
  }
  let body = ''
  for await (const chunk of req) {
    body += chunk
    if (Buffer.byteLength(body) > maxBytes)
      throw new HttpError(413, 'This request is too large.')
  }
  try {
    const value = JSON.parse(body)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error()
    return value
  } catch {
    throw new HttpError(400, 'The request contains invalid JSON.')
  }
}

function sessionCookie(res, token, maxAge) {
  res.setHeader(
    'Set-Cookie',
    `se_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  )
}

async function requireAdmin(req, db) {
  const token = req.headers.cookie
    ?.split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith('se_admin='))
    ?.slice(9)
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new HttpError(401, 'Please sign in to continue.')
  const session = await db
    .collection('sessions')
    .findOne({ _id: hash(token), expiresAt: { $gt: new Date() } })
  if (
    !session ||
    session.credentials !==
      hash(`${process.env.ADMIN_EMAIL}:${process.env.ADMIN_PASSWORD}`)
  )
    throw new HttpError(401, 'Your session has expired. Please sign in again.')
  return session
}

export default async function api(req, res) {
  try {
    const path = new URL(req.url, 'http://localhost').pathname.replace(
      /\/$/,
      '',
    )
    const method = req.method
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method))
      throw new HttpError(405, 'Method not allowed.')
    if (method !== 'GET') {
      const origin = req.headers.origin
      const host = req.headers['x-forwarded-host'] || req.headers.host
      if (origin && new URL(origin).host !== host)
        throw new HttpError(403, 'This request must come from the store.')
      if (req.headers['sec-fetch-site'] === 'cross-site')
        throw new HttpError(403, 'This request must come from the store.')
    }
    if (path === '/api/health' && method === 'GET') {
      await database()
      return send(res, 200, { ok: true })
    }
    const { db, client } = await database()

    if (path === '/api/products' && method === 'GET') {
      return send(res, 200, {
        products: (
          await db
            .collection('products')
            .find({ active: true })
            .sort({ createdAt: 1 })
            .toArray()
        ).map(publicProduct),
      })
    }

    if (path === '/api/admin/login' && method === 'POST') {
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
        throw new HttpError(
          503,
          'Admin credentials need to be configured on the server.',
        )
      const body = await readBody(req)
      if (
        typeof body.email !== 'string' ||
        typeof body.password !== 'string' ||
        body.email.length > 200 ||
        body.password.length > 200
      )
        throw new HttpError(400, 'Enter your email and password.')
      // Persist throttling across serverless invocations. No raw network addresses are stored.
      const ip = hash(
        String(
          req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown',
        ),
      )
      const window = Math.floor(Date.now() / 900000)
      const key = `${ip}:${window}`
      const attempt = await db.collection('loginAttempts').findOneAndUpdate(
        { _id: key },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date(Date.now() + 1800000) },
        },
        { upsert: true, returnDocument: 'after' },
      )
      if (attempt.count > 10)
        throw new HttpError(
          429,
          'Too many sign-in attempts. Please try again in 15 minutes.',
        )
      if (
        !equal(
          body.email.toLowerCase().trim(),
          process.env.ADMIN_EMAIL.toLowerCase().trim(),
        ) ||
        !equal(body.password, process.env.ADMIN_PASSWORD)
      )
        throw new HttpError(401, 'Email or password is incorrect.')
      const token = randomBytes(32).toString('hex')
      await db.collection('sessions').insertOne({
        _id: hash(token),
        email: process.env.ADMIN_EMAIL,
        credentials: hash(
          `${process.env.ADMIN_EMAIL}:${process.env.ADMIN_PASSWORD}`,
        ),
        expiresAt: new Date(Date.now() + 28800000),
      })
      sessionCookie(res, token, 28800)
      return send(res, 200, { email: process.env.ADMIN_EMAIL })
    }

    if (path.startsWith('/api/admin/')) {
      const session = await requireAdmin(req, db)
      if (path === '/api/admin/upload-image' && method === 'POST') {
        const { image } = await readBody(req, MAX_IMAGE_REQUEST_BYTES)
        return send(res, 201, await uploadProductImage(image))
      }
      if (path === '/api/admin/session' && method === 'GET')
        return send(res, 200, { email: session.email })
      if (path === '/api/admin/logout' && method === 'POST') {
        await db.collection('sessions').deleteOne({ _id: session._id })
        sessionCookie(res, '', 0)
        return send(res, 200, { ok: true })
      }
      if (path === '/api/admin/products' && method === 'GET')
        return send(res, 200, {
          products: (
            await db
              .collection('products')
              .find()
              .sort({ createdAt: 1 })
              .toArray()
          ).map(publicProduct),
        })
      if (path === '/api/admin/products' && method === 'POST') {
        const product = {
          ...validateProduct(await readBody(req)),
          id: randomUUID(),
          createdAt: new Date(),
        }
        await db.collection('products').insertOne(product)
        return send(res, 201, { product: publicProduct(product) })
      }
      const productMatch = path.match(
        /^\/api\/admin\/products\/([a-zA-Z0-9-]{1,100})$/,
      )
      if (productMatch && method === 'PUT') {
        const product = validateProduct(await readBody(req))
        const result = await db
          .collection('products')
          .findOneAndUpdate(
            { id: productMatch[1] },
            { $set: { ...product, updatedAt: new Date() } },
            { returnDocument: 'after' },
          )
        if (!result) throw new HttpError(404, 'Product not found.')
        return send(res, 200, { product: publicProduct(result) })
      }
      if (path === '/api/admin/orders' && method === 'GET') {
        return send(res, 200, {
          orders: (
            await db
              .collection('orders')
              .find()
              .sort({ createdAt: -1 })
              .limit(500)
              .toArray()
          ).map(publicOrder),
        })
      }
      const orderMatch = path.match(/^\/api\/admin\/orders\/(SE-[A-F0-9]{12})$/)
      if (orderMatch && method === 'PATCH') {
        const { status } = await readBody(req)
        if (!ORDER_STATUSES.includes(status))
          throw new HttpError(400, 'Choose a valid order status.')
        const transaction = client.startSession()
        let order
        try {
          await transaction.withTransaction(async () => {
            order = await db
              .collection('orders')
              .findOne({ id: orderMatch[1] }, { session: transaction })
            if (!order) throw new HttpError(404, 'Order not found.')
            if (
              ['cancelled', 'completed'].includes(order.status) &&
              order.status !== status
            )
              throw new HttpError(
                409,
                'Completed or cancelled orders cannot be reopened.',
              )
            if (status === 'cancelled' && order.status !== 'cancelled') {
              for (const item of order.items)
                await db
                  .collection('products')
                  .updateOne(
                    { id: item.id },
                    { $inc: { stock: item.quantity } },
                    { session: transaction },
                  )
            }
            await db
              .collection('orders')
              .updateOne(
                { id: order.id },
                { $set: { status, updatedAt: new Date() } },
                { session: transaction },
              )
            order.status = status
          })
        } finally {
          await transaction.endSession()
        }
        return send(res, 200, { order: publicOrder(order) })
      }
    }

    if (path === '/api/orders' && method === 'POST') {
      const checkout = validateCheckout(await readBody(req))
      const transaction = client.startSession()
      let order
      try {
        await transaction.withTransaction(async () => {
          const existing = await db
            .collection('orders')
            .findOne(
              { checkoutKey: checkout.checkoutKey },
              { session: transaction },
            )
          if (existing) {
            order = existing
            return
          }
          const products = await db
            .collection('products')
            .find(
              { id: { $in: checkout.items.map((item) => item.id) } },
              { session: transaction },
            )
            .toArray()
          const totals = calculateOrder(checkout.items, products)
          order = {
            id: `SE-${randomBytes(6).toString('hex').toUpperCase()}`,
            checkoutKey: checkout.checkoutKey,
            customer: checkout.customer,
            ...totals,
            status: 'new',
            createdAt: new Date(),
          }
          for (const item of checkout.items) {
            const result = await db
              .collection('products')
              .updateOne(
                { id: item.id, active: true, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { session: transaction },
              )
            if (!result.modifiedCount)
              throw new HttpError(
                409,
                'Stock changed. Please refresh your cart and try again.',
              )
          }
          await db
            .collection('orders')
            .insertOne(order, { session: transaction })
        })
      } finally {
        await transaction.endSession()
      }
      // A retry receives only the receipt; personal details are never returned publicly.
      return send(res, 201, {
        order: {
          id: order.id,
          items: order.items,
          subtotal: order.subtotal,
          delivery: order.delivery,
          total: order.total,
        },
      })
    }
    throw new HttpError(404, 'This endpoint does not exist.')
  } catch (error) {
    if (error instanceof HttpError)
      return send(res, error.status, { error: error.message })
    // Database exceptions can include credentials or customer data; keep them out of responses and logs.
    console.error('Store API error:', error.name || 'Error', error.code || '')
    return send(res, 503, {
      error:
        'The store is temporarily unavailable. Please try again shortly or contact us on WhatsApp.',
    })
  }
}
