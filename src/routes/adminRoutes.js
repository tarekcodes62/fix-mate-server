import express from 'express';

import { updateServiceApproval } from '../controllers/adminController.js';

import verifyToken from '../middleware/verifyToken.js';
import { verifyAdmin } from '../middleware/verifyRole.js';

const router = express.Router();

router.patch(
  '/services/:id/approval',
  verifyToken,
  verifyAdmin,
  updateServiceApproval,
);

export default router;
