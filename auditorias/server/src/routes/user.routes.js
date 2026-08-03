import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getUsers, createUser, updateUserRole, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
