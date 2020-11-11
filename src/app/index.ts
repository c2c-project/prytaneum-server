import express from 'express';

import config from 'config/app';
import routes from 'routes';
import { errorHandler } from 'middlewares';

const app = express();
config(app);
app.use('/api', routes);
app.use(errorHandler());

export default app;
