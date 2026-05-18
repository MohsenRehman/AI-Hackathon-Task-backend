import { Router } from 'express';
import { getAdminAnalytics, getDoctorAnalytics } from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requirePlan } from '../middleware/plan.middleware.js';

const router = Router();

router.use(protect);

router.get('/admin', authorize('admin'), requirePlan('advancedAnalytics'), getAdminAnalytics);
router.get('/doctor', authorize('admin', 'doctor'), getDoctorAnalytics);

export default router;
