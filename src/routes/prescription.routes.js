import { Router } from 'express';
import { createPrescription, getPrescriptions, downloadPrescription } from '../controllers/prescription.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requirePlan } from '../middleware/plan.middleware.js';

const router = Router();

router.use(protect);

router.post('/', authorize('admin', 'doctor'), createPrescription);
router.get('/', authorize('admin', 'doctor', 'patient'), getPrescriptions);
router.get('/:id/download', downloadPrescription);

export default router;
