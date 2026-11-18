import express from 'express';

import {
  getAllTransactions,
  getAllUsers,
  updateUserRole,
  getAllServices,
  updateServiceApproval,
} from '../controllers/adminController.js';

import verifyToken from '../middleware/verifyToken.js';
import { verifyAdmin } from '../middleware/verifyRole.js';

const router = express.Router();

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

export default router;
