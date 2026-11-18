import express from 'express';
import { createCheckoutSession } from '../controllers/paymentController.js';
import verifyToken from '../middleware/verifyToken.js';
import { verifyCustomer } from '../middleware/verifyRole.js';

const router = express.Router();

router.post(
  '/create-checkout-session',
  verifyToken,
  verifyCustomer,
  createCheckoutSession,
);

export default router;
