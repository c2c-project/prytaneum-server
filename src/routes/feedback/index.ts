/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';

import feedbackReportRoutes from './feedback-reports';

const router = Router();
router.use(feedbackReportRoutes);

export default router;
