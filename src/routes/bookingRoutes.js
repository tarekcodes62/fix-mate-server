import express from 'express';

import {
  createBooking,
  getMyBookings,
  cancelBooking,
} from '../controllers/bookingController.js';

import verifyToken from '../middleware/verifyToken.js';
import { verifyCustomer } from '../middleware/verifyRole.js';

const router = express.Router();

// Customer routes
router.post('/', verifyToken, verifyCustomer, createBooking);

router.get('/my-bookings', verifyToken, verifyCustomer, getMyBookings);

router.patch('/:id/cancel', verifyToken, verifyCustomer, cancelBooking);

export default router;
