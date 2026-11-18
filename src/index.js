import 'dotenv/config';
import app from './app.js';
import connectToMongoDB from './config/db.js';
const port = process.env.PORT;

await connectToMongoDB();

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
