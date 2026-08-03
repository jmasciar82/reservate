import express from 'express';
import { googleLogin, loginWithPassword, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/google', googleLogin);
router.post('/login', loginWithPassword);
router.get('/me', protect, getMe);

export default router;
