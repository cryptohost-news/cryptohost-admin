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
    // // Получаем требуемую ширину изображения из запроса клиента
    // const { imageWidth, thumbWidth } = req.query;
    // const desiredImageWidth = imageWidth ? parseInt(imageWidth) : 800;
    // const desiredThumbWidth = thumbWidth ? parseInt(thumbWidth) : 400;
    //
    // // Формируем пути для сохранения изображений
    // const imagePath = `${req.file.destination}/${req.file.filename}`;
    // const thumbnailPath = `${req.file.destination}/${
    //   req.file.filename.split('.')[0]
    // }-thumb.${req.file.filename.split('.').pop()}`;
    //
    // // Открываем изображение с помощью Jimp
    // const image = await Jimp.read(imagePath);
    //
    // // Сжимаем изображение с заданным качеством (от 0 до 100)
    // await image.quality(60); // Примерно 80% качества
    //
    // // Изменяем размер изображения по ширине с сохранением пропорций
    // await image.resize(desiredImageWidth, Jimp.AUTO);
    //
    // // Сохраняем измененное изображение
    // await image.writeAsync(imagePath);
    //
    // // Создаем миниатюру изображения с шириной 600 пикселей
    // // const thumbnail = image.clone(); // Клонируем изображение для миниатюры
    // // await thumbnail.resize(desiredThumbWidth, Jimp.AUTO); // Изменяем размер для миниатюры
    // // await thumbnail.writeAsync(thumbnailPath); // Сохраняем миниатюру
    //
    // // Отправляем URL в ответе
    // // res.status(201).json({ imageUrl: imagePath, thumbnailUrl: thumbnailPath });
    // res.status(201).json({ imageUrl: imagePath });

    // Получаем требуемую ширину изображения из запроса клиента
    const { imageWidth, thumbWidth } = req.query;
    const desiredImageWidth = imageWidth ? parseInt(imageWidth) : 800;
    const desiredThumbWidth = thumbWidth ? parseInt(thumbWidth) : 400;

    // Формируем пути для сохранения изображений
    const imagePath = `${req.file.destination}/${req.file.filename}`;
    const thumbnailPath = `${req.file.destination}/${
      req.file.filename.split('.')[0]
    }-thumb.${req.file.filename.split('.').pop()}`;

    // Создаем временный файл для конвертации
    const tempImagePath = `${req.file.destination}/${req.file.filename}-temp.jpg`;

    // Сконвертируем изображение в JPEG с помощью sharp
    await sharp(req.file.path)
      .jpeg({ quality: 60 })
      .toFile(tempImagePath);

    // Закрываем изображение с помощью sharp
    sharp.cache(false); // Отключаем кэширование sharp для предотвращения блокировки файла
    await sharp.cache(true); // Включаем кэширование sharp обратно

    // Удаляем исходное изображение
    fs.unlinkSync(req.file.path);

    // Открываем временное изображение с помощью Jimp
    const image = await Jimp.read(tempImagePath);

    await image.quality(50);

    // Изменяем размер изображения по ширине с сохранением пропорций
    await image.resize(desiredImageWidth, Jimp.AUTO);

    // Сохраняем измененное изображение
    await image.writeAsync(imagePath);

    // Удаляем временное изображение
    fs.unlinkSync(tempImagePath);

    // Создаем миниатюру изображения с шириной 600 пикселей
    // const thumbnail = image.clone(); // Клонируем изображение для миниатюры
    // await thumbnail.resize(desiredThumbWidth, Jimp.AUTO); // Изменяем размер для миниатюры
    // await thumbnail.writeAsync(thumbnailPath); // Сохраняем миниатюру

    // Отправляем URL в ответе
    // res.status(201).json({ imageUrl: imagePath, thumbnailUrl: thumbnailPath });
    res.status(201).json({ imageUrl: imagePath });
  } catch (error) {
    return res.status(500).json({
      message: `Ошибка при загрузке изображения: ${error}`,
    });
  }
};
