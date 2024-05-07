import express from 'express';
import { CryptoCurrenciesController } from '../controllers/index.js';

const router = express.Router();

router.get('/public', CryptoCurrenciesController.getAll);

export default router;
