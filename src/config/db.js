import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URL);

let db;

export async function connectToMongoDB() {
  try {
    await client.connect();

    db = client.db(process.env.DB_NAME);

    console.log('You successfully connected to MongoDB!');

    return client;
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    throw err;
  }
}

export const getDB = () => db;

export default connectToMongoDB;
