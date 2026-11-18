import express from 'express';

import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getTechnicianBookings,
  updateBookingStatus,
} from '../controllers/bookingController.js';

import verifyToken from '../middleware/verifyToken.js';
import { verifyCustomer, verifyTechnician } from '../middleware/verifyRole.js';

const router = express.Router();

// Customer routes
router.post('/', verifyToken, verifyCustomer, createBooking);

router.get('/my-bookings', verifyToken, verifyCustomer, getMyBookings);

router.patch('/:id/cancel', verifyToken, verifyCustomer, cancelBooking);

// Technician routes
router.get(
  '/technician-requests',
  verifyToken,
  verifyTechnician,
  getTechnicianBookings,
);

router.patch('/:id/status', verifyToken, verifyTechnician, updateBookingStatus);

export default router;
