import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.BATABASE_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('You successfully connected to MongoDB!');
    return client;
  } catch (err) {
    console.dir(err);
  }
}

export default connectToMongoDB;
