import express from 'express';

import {
  getServices,
  getServiceById,
  getMyServiceById,
  createService,
  updateService,
  deleteService,
  getMyServices,
  toggleServiceAvailability,
} from '../controllers/serviceController.js';

import verifyToken from '../middleware/verifyToken.js';
import { verifyTechnician } from '../middleware/verifyRole.js';

const router = express.Router();

// Public routes
router.get('/', getServices);

// Technician routes
router.get('/my-services', verifyToken, verifyTechnician, getMyServices);

router.post('/', verifyToken, verifyTechnician, createService);

router.patch('/:id', verifyToken, verifyTechnician, updateService);

router.patch(
  '/:id/availability',
  verifyToken,
  verifyTechnician,
  toggleServiceAvailability,
);

router.delete('/:id', verifyToken, verifyTechnician, deleteService);

router.get('/my-services/:id', verifyToken, verifyTechnician, getMyServiceById);
// Keep this route after specific routes
router.get('/:id', getServiceById);

export default router;
