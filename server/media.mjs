import { v2 as cloudinary } from 'cloudinary'
import { HttpError } from './domain.mjs'

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024
// Base64 plus the small JSON envelope stays below Vercel's function body limit.
export const MAX_IMAGE_REQUEST_BYTES = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 1024

function validateImage(image) {
  if (typeof image !== 'string')
    throw new HttpError(400, 'Choose a JPG, PNG, or WebP image.')
  if (image.length > MAX_IMAGE_REQUEST_BYTES)
    throw new HttpError(413, 'Choose an image smaller than 3 MB.')
  const match = image.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/,
  )
  if (!match) throw new HttpError(400, 'Choose a JPG, PNG, or WebP image.')
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > MAX_IMAGE_BYTES)
    throw new HttpError(413, 'Choose an image smaller than 3 MB.')
  const signatures = {
    'image/jpeg': buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/png': buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/webp':
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP',
  }
  if (buffer.toString('base64') !== match[2] || !signatures[match[1]])
    throw new HttpError(
      400,
      'This file is not a valid JPG, PNG, or WebP image.',
    )
}

export async function uploadProductImage(image) {
  validateImage(image)
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const api_key = process.env.CLOUDINARY_API_KEY?.trim()
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim()
  if (!cloud_name || !api_key || !api_secret)
    throw new HttpError(
      503,
      'Configure Cloudinary on the server before uploading images.',
    )
  try {
    const result = await cloudinary.uploader.upload(image, {
      cloud_name,
      api_key,
      api_secret,
      resource_type: 'image',
      folder: 'se-store/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      format: 'webp',
      transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
      timeout: 45000,
    })
    if (!result.secure_url?.startsWith('https://')) throw new Error()
    return { image: result.secure_url }
  } catch {
    // Provider errors can contain request credentials; never return or log them.
    throw new HttpError(
      502,
      'Image upload failed. Try again or check the Cloudinary settings on the server.',
    )
  }
}
