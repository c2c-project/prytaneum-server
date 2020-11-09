import { Router } from 'express';

import townhallRoutes from './townhalls';
import userRoutes from './users';

const router = Router();

router.use('/users', userRoutes);
router.use('/townhalls', townhallRoutes);

export default router;
