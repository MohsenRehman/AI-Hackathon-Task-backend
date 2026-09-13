import { Router } from 'express';
import { checkSymptoms, getPrescriptionExplanation } from '../controllers/diagnosis.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requirePlan } from '../middleware/plan.middleware.js';

const router = Router();

router.use(protect);

// Only doctors or admins can use the symptom checker
router.post('/ai', authorize('admin', 'doctor'), requirePlan('aiEnabled'), checkSymptoms);

// Doctors, admins, and patients can get prescription explanations
router.get('/explain/:prescriptionId', authorize('admin', 'doctor', 'patient'), getPrescriptionExplanation);

export default router;
