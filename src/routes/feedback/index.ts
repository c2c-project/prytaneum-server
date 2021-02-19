/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';

import feedbackReportRoutes from './feedback-reports';
import bugReportRoutes from './bug-reports';

const router = Router();
router.use('/feedback-reports', feedbackReportRoutes);
router.use('/bug-reports', bugReportRoutes);

export default router;
