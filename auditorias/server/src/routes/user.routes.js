import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { getUsers, updateUserRole } from '../controllers/user.controller.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);

export default router;
