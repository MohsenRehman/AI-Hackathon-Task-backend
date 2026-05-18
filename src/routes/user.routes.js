import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  updateProfileImage 
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);

// Shared route
router.get('/', authorize('admin', 'receptionist', 'doctor'), getUsers);
router.post('/profile-image', upload.single('image'), updateProfileImage);

// Admin-only CRUD
router.post('/', authorize('admin'), createUser);
router.patch('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
