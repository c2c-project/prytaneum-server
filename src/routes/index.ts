import { Router } from 'express';

import townhallRoutes from './townhalls';
import userRoutes from './users';
import feedbackRoutes from './feedback';

const router = Router();

router.use('/users', userRoutes);
router.use('/townhalls', townhallRoutes);
router.use(feedbackRoutes);

export default router;
