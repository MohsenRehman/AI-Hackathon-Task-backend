import { Router } from 'express';
import { upgradePlan, getMyPlan } from '../controllers/subscription.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/my-plan', getMyPlan);
router.post('/upgrade', upgradePlan);

export default router;
