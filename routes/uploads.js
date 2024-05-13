import express from 'express';
import { UploadController } from '../controllers/index.js';
import { authAdmin } from '../middleware/auth.js';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { uploadImage } from '../controllers/UploadController.js';

// создаем хранилище для файлов (например, изображений)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Получаем тип сущности из параметров маршрута
    const entityFolder = req.params.entityType.toLowerCase();

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Добавляем ноль спереди, если месяц состоит из одной цифры
    const formattedDate = `${year}-${month}`;

    const uploadPath = `uploads/temp/${entityFolder}/${formattedDate}`;

    // Проверяем, существует ли папка для данного типа сущности
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Создаем папку (и подпапки, если их нет) рекурсивно
    }

    cb(null, uploadPath); // Указываем путь для сохранения файла
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла с помощью uuid
    const uniqueFileName = `${uuidv4()}.${file.originalname.split('.').pop()}`;
    cb(null, uniqueFileName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heif', 'image/heic'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый MIME type'));
    }
  }
});

const router = express.Router();

/* POST upload img */
router.post(
  '/:entityType',
  authAdmin,
  upload.single('image'),
  UploadController.uploadImage
);

export default router;
