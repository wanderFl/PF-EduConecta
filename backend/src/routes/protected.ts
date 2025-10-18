import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Protected routes examples
router.get(
  '/directivo/dashboard',
  authenticate,
  authorize(Role.DIRECTIVO),
  (req, res) => {
    res.json({ message: 'Directivo dashboard data' });
  }
);

router.get(
  '/docente/courses',
  authenticate,
  authorize(Role.DOCENTE),
  (req, res) => {
    res.json({ message: 'Docente courses data' });
  }
);

router.get(
  '/familia/students',
  authenticate,
  authorize(Role.FAMILIA),
  (req, res) => {
    res.json({ message: 'Familia students data' });
  }
);


export default router;