import { Router } from 'express';
import { createPatient, getPatients, getPatientById } from '../controllers/patient.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);
router.use(authorize('admin', 'doctor', 'receptionist'));

router.post('/', createPatient);
router.get('/', getPatients);
router.get('/:id', getPatientById);

export default router;
