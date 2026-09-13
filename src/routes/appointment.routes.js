import { Router } from 'express';
import { createAppointment, getAppointments, updateAppointmentStatus } from '../controllers/appointment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);

router.post('/', authorize('admin', 'doctor', 'receptionist', 'patient'), createAppointment);
router.get('/', getAppointments);
router.patch('/:id/status', authorize('admin', 'doctor', 'receptionist'), updateAppointmentStatus);

export default router;
