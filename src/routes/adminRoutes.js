import express from 'express';

import {
  getAdminStats,
  getAllTransactions,
  getAllUsers,
  updateUserRole,
  getAllServices,
  updateServiceApproval,
  getAllBookings,
} from '../controllers/adminController.js';

import verifyToken from '../middleware/verifyToken.js';
import { verifyAdmin } from '../middleware/verifyRole.js';

const router = express.Router();

router.get('/stats', verifyToken, verifyAdmin, getAdminStats);

router.get('/transactions', verifyToken, verifyAdmin, getAllTransactions);
router.get('/users', verifyToken, verifyAdmin, getAllUsers);

router.patch('/users/:id/role', verifyToken, verifyAdmin, updateUserRole);

router.get('/services', verifyToken, verifyAdmin, getAllServices);

router.patch(
  '/services/:id/approval',
  verifyToken,
  verifyAdmin,
  updateServiceApproval,
);

router.get('/bookings', verifyToken, verifyAdmin, getAllBookings);

export default router;
