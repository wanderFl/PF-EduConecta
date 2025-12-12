import { Router } from 'express';
import { login, register, registerParent, forgotPassword, resetPassword, registerDeviceToken } from '../controllers/auth';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/register/parent', registerParent);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/device-token', authenticate, registerDeviceToken);

export default router;