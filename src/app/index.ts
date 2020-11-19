import express from 'express';

import config from 'config/app';
import routes from 'routes';
import { errorHandler, notFound } from 'middlewares';

const app = express();
config(app);
app.use('/api', routes);
app.use(notFound());
app.use(errorHandler());

export default app;
