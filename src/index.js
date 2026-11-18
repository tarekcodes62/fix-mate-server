import 'dotenv/config';
import app from './app.js';
import connectToMongoDB from './config/db.js';
const port = process.env.PORT;

const connectedClient = await connectToMongoDB();
const db = connectedClient.db('fixmate');
const users = db.collection('user');

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
