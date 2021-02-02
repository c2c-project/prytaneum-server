import { Router } from 'express';

import townhallRoutes from './townhalls';
import userRoutes from './users';
import notificationRoutes from './notifications';

const router = Router();

router.use('/users', userRoutes);
router.use('/townhalls', townhallRoutes);
router.use('/notifications', notificationRoutes);

export default router;
