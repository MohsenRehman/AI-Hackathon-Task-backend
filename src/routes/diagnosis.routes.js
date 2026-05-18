import { Router } from 'express';
import { checkSymptoms, getPrescriptionExplanation } from '../controllers/diagnosis.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requirePlan } from '../middleware/plan.middleware.js';

const router = Router();

router.use(protect);
// Only doctors or admins can use the symptom checker
router.use(authorize('admin', 'doctor'));

router.post('/ai', requirePlan('aiEnabled'), checkSymptoms);
router.get('/explain/:prescriptionId', requirePlan('aiEnabled'), getPrescriptionExplanation);

export default router;
