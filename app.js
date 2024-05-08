import express from 'express';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import adminRouter from './routes/admin.js';
import usersRouter from './routes/users.js';
import promoBannerRouter from './routes/promo-banner.js';
import newsCategoryRouter from './routes/news-categories.js';
import uploadRouter from './routes/uploads.js';
import newsPostsRouter from './routes/news-posts.js';
import cryptoActivitiesRouter from './routes/crypto-activities.js';
import cryptoCurrenciesRouter from './routes/crypto-currencies.js';

const app = express();

app.use(logger('dev'));

const corsOptions = {
  origin: ['http://localhost:3000', 'http://192.168.1.56:3000', 'https://admin.crypto-host.net'],
  credentials: true // Разрешить передачу куки и заголовков авторизации
};
// вызываем корс как мидлвару
app.use(cors(corsOptions));

// Добавляем заголовок Content-Security-Policy
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' blob:;");
  next();
});

// если запрос придет на uploads, то нужно взять функцию statiс из библиотеки express и проверить есть ли в этой папке то, что я передаю
app.use('/uploads', express.static('uploads'));

// нужно для того, чтобы в запросы можно было передавать тело
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//
app.use(cookieParser());

app.use('/api/admin', adminRouter);
app.use('/api/user', usersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/promo-banners', promoBannerRouter);
app.use('/api/news-categories', newsCategoryRouter);
app.use('/api/news-posts', newsPostsRouter);
app.use('/api/crypto-activities', cryptoActivitiesRouter);

app.use('/api/crypto-currencies', cryptoCurrenciesRouter);

export default app;
