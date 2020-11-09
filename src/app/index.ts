import express from 'express';

import config from 'config/app';

const app = express();
config(app);

export default app;
