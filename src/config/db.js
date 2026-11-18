import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URL);

let db;

export async function connectToMongoDB() {
  try {
    await client.connect();

    db = client.db(process.env.DB_NAME);

    // Prevent duplicate payments for a booking
    await db
      .collection('payments')
      .createIndex({ bookingId: 1 }, { unique: true });

    // Prevent duplicate Stripe sessions
    await db
      .collection('payments')
      .createIndex({ stripeSessionId: 1 }, { unique: true });

    console.log('You successfully connected to MongoDB!');

    return client;
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    throw err;
  }
}

export const getDB = () => db;

export default connectToMongoDB;
