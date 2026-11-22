import app from './app.js';
import connectToMongoDB from './config/db.js';

export default async function handler(req, res) {
  try {
    await connectToMongoDB();
    return app(req, res);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
