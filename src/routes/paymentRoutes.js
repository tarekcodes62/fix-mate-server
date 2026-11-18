import express from 'express';
import {
  createCheckoutSession,
  verifyPayment,
  getMyPayments,
} from '../controllers/paymentController.js';
import verifyToken from '../middleware/verifyToken.js';
import { verifyCustomer } from '../middleware/verifyRole.js';

const router = express.Router();

router.post(
  '/create-checkout-session',
  verifyToken,
  verifyCustomer,
  createCheckoutSession,
);

router.get('/verify-session', verifyToken, verifyCustomer, verifyPayment);

router.get('/my-payments', verifyToken, verifyCustomer, getMyPayments);

export default router;
