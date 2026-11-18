import express from 'express';

import { createBooking } from '../controllers/bookingController.js';

import verifyToken from '../middleware/verifyToken.js';
import { verifyCustomer } from '../middleware/verifyRole.js';

const router = express.Router();

// Customer creates booking
router.post('/', verifyToken, verifyCustomer, createBooking);

export default router;
