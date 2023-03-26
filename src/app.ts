require('dotenv').config();
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import {notFound, errorHandler} from './middlewares';
import api from './api';
import MessageResponse from './interfaces/MessageResponse';
import authRoute from './api/routes/authRoute';
import catRoute from './api/routes/catRoute';
import userRoute from './api/routes/userRoute';

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API location: api/v1',
  });
});

app.use('/api/v1', api);
app.use('auth', authRoute);
app.use('cats', catRoute);
app.use('users', userRoute);

app.use(notFound);
app.use(errorHandler);

export default app;