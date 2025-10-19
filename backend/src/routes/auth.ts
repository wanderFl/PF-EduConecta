import { Router } from 'express';
import { login, register, registerParent } from '../controllers/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/register/parent', registerParent);

export default router;