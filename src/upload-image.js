import { request } from './api'

export async function uploadImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose a JPG, PNG, or WebP image.')
  if (file.size > 3 * 1024 * 1024)
    throw new Error('Choose an image smaller than 3 MB.')
  const image = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () =>
      reject(new Error('Could not read this image. Try another file.'))
    reader.readAsDataURL(file)
  })
  return request('/admin/upload-image', { method: 'POST', body: { image } })
}
