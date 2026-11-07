import { money, whatsapp } from './api.js'

export function orderWhatsAppUrl(order, customer) {
  const lines = [
    'Hello Shahzad Electronics! I would like to confirm my order.',
    '',
    `*Order: ${order.id}*`,
    '',
    '*Items*',
    ...order.items.map(
      (item) =>
        `• ${item.name} × ${item.quantity} — ${money(item.price * item.quantity)}`,
    ),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    `Delivery: ${order.delivery ? money(order.delivery) : 'Free'}`,
    `*Total: ${money(order.total)}*`,
  ]
  if (customer) {
    lines.push(
      '',
      '*Delivery details*',
      `Name: ${customer.name.trim()}`,
      `Phone: ${customer.phone.trim()}`,
      `City: ${customer.city.trim()}`,
      `Address: ${customer.address.trim()}`,
    )
    if (customer.notes?.trim()) lines.push(`Notes: ${customer.notes.trim()}`)
  }
  lines.push('', 'Please confirm availability, delivery and payment details.')
  return `${whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`
}
