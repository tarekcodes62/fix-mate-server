import express from 'express';

import {
  updateServiceApproval,
  getAllTransactions,
  getAllUsers,
  updateUserRole,
} from '../controllers/adminController.js';

import verifyToken from '../middleware/verifyToken.js';
import { verifyAdmin } from '../middleware/verifyRole.js';

const router = express.Router();

router.patch(
  '/services/:id/approval',
  verifyToken,
  verifyAdmin,
  updateServiceApproval,
);

router.get('/transactions', verifyToken, verifyAdmin, getAllTransactions);
router.get('/users', verifyToken, verifyAdmin, getAllUsers);

router.patch('/users/:id/role', verifyToken, verifyAdmin, updateUserRole);

export default router;
