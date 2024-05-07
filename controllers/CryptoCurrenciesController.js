import path from 'path';
import prisma from '../prisma/prisma-client.js';
import { slugify } from 'transliteration';
import deleteCoverImg from '../utils/delete-cover-img.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import getPreviewFromBody from '../utils/get-preview-from-body.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 *
 @route GET /api/crypto-rates/
 @desc Получение всех курсов криптовалют
 @access Public
 */
export const getAll = async (req, res) => {
  try {
    const cryptoCurrencies = await prisma.cryptoCurrency.findMany({});
    const data = cryptoCurrencies.map((currency) => ({
      name: currency.name,
      shortName: currency.short_name,
      price: currency.price,
      dayPercent: currency.day_percent,
      isPositive: currency.is_positive
    }));

    res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({
      message: `Не удалось получить курсы валют: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }
};
