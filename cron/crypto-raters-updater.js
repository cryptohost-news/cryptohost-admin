import cron from 'node-cron';
import { getCurrencyRates } from '../utils/fetch-cryptorates.js';
import prisma from '../prisma/prisma-client.js';

const OUT_CURRENCY = 'USD';

cron.schedule('* * * * *', async () => {
  try {
    const cryptoRates = await getCurrencyRates(OUT_CURRENCY);
    for (const rate of cryptoRates) {
      await prisma.cryptoCurrency.upsert({
        where: { short_name: rate.short_name }, // Уникальный идентификатор
        update: { // Обновление данных, если запись уже существует
          ...rate
        },
        create: { // Создание новой записи, если запись не существует
          ...rate
        }
      });
    }
    console.log('Crypto rates saved successfully.');
  } catch (error) {
    console.error('Error saving crypto rates:', error);
  }
});
