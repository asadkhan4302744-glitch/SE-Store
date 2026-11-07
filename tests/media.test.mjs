import test from 'node:test'
import assert from 'node:assert/strict'
import { v2 as cloudinary } from 'cloudinary'
import { MAX_IMAGE_BYTES, uploadProductImage } from '../server/media.mjs'

const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
const keys = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]
function configure(t) {
  const saved = keys.map((key) => process.env[key])
  keys.forEach((key) => {
    process.env[key] = 'test-only'
  })
  t.after(() =>
    keys.forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key]
      else process.env[key] = saved[i]
    }),
  )
}

test('uploads only image data and returns the secure URL without credentials', async (t) => {
  configure(t)
  const url = 'https://res.cloudinary.com/test-only/image/upload/test.webp'
  const upload = t.mock.method(
    cloudinary.uploader,
    'upload',
    async (image, options) => {
      assert.equal(image, png)
      assert.equal(options.resource_type, 'image')
      assert.equal(options.folder, 'se-store/products')
      assert.equal(options.format, 'webp')
      assert.equal(options.api_secret, 'test-only')
      return { secure_url: url, api_key: 'private', public_id: 'test' }
    },
  )
  assert.deepEqual(await uploadProductImage(png), { image: url })
  assert.equal(upload.mock.callCount(), 1)
})

test('rejects external URLs, SVG, disguised files, malformed base64 and oversized images before upload', async (t) => {
  const upload = t.mock.method(cloudinary.uploader, 'upload', () => {
    throw new Error('Must not upload')
  })
  for (const image of [
    null,
    'https://example.com/image.png',
    'data:image/svg+xml;base64,PHN2Zy8+',
    'data:image/png;base64,aGVsbG8=',
    png.slice(0, -1),
  ])
    await assert.rejects(uploadProductImage(image), { status: 400 })
  const large = Buffer.alloc(MAX_IMAGE_BYTES + 1)
  await assert.rejects(
    uploadProductImage(`data:image/png;base64,${large.toString('base64')}`),
    { status: 413 },
  )
  assert.equal(upload.mock.callCount(), 0)
})

test('missing configuration is actionable and provider errors never leak secrets', async (t) => {
  configure(t)
  delete process.env.CLOUDINARY_API_SECRET
  await assert.rejects(uploadProductImage(png), { status: 503 })
  process.env.CLOUDINARY_API_SECRET = 'test-only'
  t.mock.method(cloudinary.uploader, 'upload', async () => {
    throw new Error('credential=test-only')
  })
  await assert.rejects(
    uploadProductImage(png),
    (error) => error.status === 502 && !error.message.includes('test-only'),
  )
})
