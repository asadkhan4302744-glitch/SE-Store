export const products = [
  {
    id: 'router-power-bank-12v',
    name: '12V Router Power Bank',
    shortName: 'Router Power Bank',
    description: 'Compact six-cell backup power for compatible 12V routers.',
    price: 2000,
    category: 'Power & Backup',
    image: '/images/router-power-bank-hero.png',
    badge: 'Featured',
    packSize: 1,
  },
  {
    id: 'router-power-bank-duo',
    name: 'Router Power Bank Duo Pack',
    shortName: 'Duo Pack',
    description: 'Two 12V router power banks in one order for two connections or locations.',
    price: 4000,
    category: 'Bundles',
    image: '/images/router-power-bank-catalog.png',
    badge: '2 units',
    packSize: 2,
  },
  {
    id: 'router-power-bank-triple',
    name: 'Router Power Bank Triple Pack',
    shortName: 'Triple Pack',
    description: 'Three 12V router power banks with free delivery under the store-wide offer.',
    price: 6000,
    category: 'Bundles',
    image: '/images/router-power-bank-in-use.png',
    badge: 'Free delivery',
    packSize: 3,
  },
]

export const enquiryCollections = [
  {
    id: 'networking-enquiry',
    name: 'Routers & Networking',
    description: 'Ask Shahzad Electronics about routers and networking equipment.',
    category: 'Networking',
    icon: 'wifi',
  },
  {
    id: 'security-enquiry',
    name: 'CCTV & Security',
    description: 'Send your security equipment requirements for price and availability.',
    category: 'Security',
    icon: 'camera',
  },
  {
    id: 'accessories-enquiry',
    name: 'Chargers, Cables & Accessories',
    description: 'Share the connector, model or accessory you need for a quick response.',
    category: 'Accessories',
    icon: 'cable',
  },
  {
    id: 'electronics-enquiry',
    name: 'Other Electronics',
    description: 'Can’t find an item? Send us its name or photo on WhatsApp.',
    category: 'Other Electronics',
    icon: 'lightbulb',
  },
]

export const catalogCategories = [
  'All',
  'Power & Backup',
  'Bundles',
  'Networking',
  'Security',
  'Accessories',
  'Other Electronics',
]

export const featuredProduct = products[0]
