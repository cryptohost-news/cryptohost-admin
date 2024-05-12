import Jimp from 'jimp';
import fs from 'fs';
import sharp from 'sharp';

/**
 *
 @route POST /api/upload/:entityType
 @desc Загрузка изображения
 @access Private
 */
export const uploadImage = async (req, res) => {
  try {
    const { imageWidth, pixelized = true } = req.query;
    const desiredImageWidth = imageWidth ? parseInt(imageWidth) : 800;

    const desiredImageWidths = {
      'sm': 400,
      'md': 800,
      'lg': 1200
    };
    const desiredPixelSizes = {
      'sm': [3, 4],
      'md': [6, 7],
      'lg': [10, 11]
    };

    // Формируем пути для сохранения изображений
    const imagePath = `${req.file.destination}/${req.file.filename}`;

    // Создаем временный файл для конвертации
    const tempImagePath = `${req.file.destination}/${req.file.filename}-temp.jpg`;

    // Сконвертируем изображение в JPEG с помощью sharp
    await sharp(req.file.path)
      .jpeg()// убрал настройку качества
      .toFile(tempImagePath);

    // Закрываем изображение с помощью sharp
    sharp.cache(false); // Отключаем кэширование sharp для предотвращения блокировки файла
    await sharp.cache(true); // Включаем кэширование sharp обратно

    // Удаляем исходное изображение
    fs.unlinkSync(req.file.path);

    if (pixelized === true) {
      const imageParams = Object.entries(desiredImageWidths);

      for (const imageParam of imageParams) {
        const [imageSize, imageWidth] = imageParam;
        // Создаем временное изображение с помощью Jimp
        const image = await Jimp.read(tempImagePath);
        await image.quality(50);

        await image.resize(imageWidth, Jimp.AUTO);

        const pixelSizes = desiredPixelSizes[imageSize];

        for (let i = 0; i < pixelSizes.length; i += 1) {
          const pixelSize = pixelSizes[i];

          for (let y = 0; y < image.bitmap.height; y += pixelSize) {
            for (let x = 0; x < image.bitmap.width; x += pixelSize) {
              const color = image.getPixelColor(x, y); // Получаем цвет пикселя
              for (let dy = 0; dy < pixelSize; dy++) {
                for (let dx = 0; dx < pixelSize; dx++) {
                  // Устанавливаем цвет для каждого пикселя в блоке
                  image.setPixelColor(color, x + dx, y + dy);
                }
              }
            }
          }

          const firstOutputImagePath = `${req.file.destination}/${
            req.file.filename.split('.')[0]
          }-${imageSize}-${i % 2}.${req.file.filename.split('.').pop()}`;

          // Сохраняем измененное изображение
          await image.writeAsync(firstOutputImagePath);
        }
      }

      // Создаем временное изображение с помощью Jimp
      const image = await Jimp.read(tempImagePath);
      await image.quality(50);

      // Изменяем размер изображения по ширине с сохранением пропорций
      await image.resize(desiredImageWidth, Jimp.AUTO);

      // Сохраняем измененное изображение
      await image.writeAsync(imagePath);

      // Удаляем временное изображение
      fs.unlinkSync(tempImagePath);

      res.status(201).json({ imageUrl: imagePath });
    }

  } catch (error) {
    return res.status(500).json({
      message: `Ошибка при загрузке изображения: ${error}`
    });
  }
};

