import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { products as seedProducts } from '../src/catalog.js'

let connection
export async function database() {
  if (!process.env.MONGODB_URI) throw new Error('Database is not configured')
  if (!connection)
    connection = (async () => {
      const client = new MongoClient(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 7000,
        connectTimeoutMS: 7000,
      })
      try {
        await client.connect()
        const db = client.db(process.env.MONGODB_DB || 'se_store')
        await Promise.all([
          db.collection('products').createIndex({ id: 1 }, { unique: true }),
          db
            .collection('orders')
            .createIndex({ checkoutKey: 1 }, { unique: true }),
          db.collection('orders').createIndex({ createdAt: -1 }),
          db
            .collection('sessions')
            .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
          db
            .collection('loginAttempts')
            .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        ])
        await db.collection('products').bulkWrite(
          seedProducts.map((product) => ({
            updateOne: {
              filter: { id: product.id },
              update: {
                $setOnInsert: {
                  ...product,
                  active: true,
                  stock: 25,
                  createdAt: new Date(),
                },
              },
              upsert: true,
            },
          })),
        )
        return { db, client }
      } catch (error) {
        await client.close()
        throw error
      }
    })().catch((error) => {
      connection = undefined
      throw error
    })
  return connection
}

export async function closeDatabase() {
  if (connection) {
    const { client } = await connection
    await client.close()
    connection = undefined
  }
}
