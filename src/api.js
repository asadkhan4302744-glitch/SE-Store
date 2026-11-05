export async function request(path, options = {}) {
  const { body, ...rest } = options
  let response
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...rest,
      ...(body
        ? {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        : {}),
    })
  } catch {
    throw new Error('Could not connect. Check your connection and try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(
      data.error || 'Something went wrong. Please try again.',
    )
    error.status = response.status
    throw error
  }
  return data
}

export const money = (amount) =>
  `Rs. ${Number(amount).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`
export const whatsapp = 'https://wa.me/923187083785'
