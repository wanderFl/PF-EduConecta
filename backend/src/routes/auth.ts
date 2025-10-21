import { Router } from 'express';
import { login, register, registerParent, forgotPassword, resetPassword } from '../controllers/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/register/parent', registerParent);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;