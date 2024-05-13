import fs from 'fs';
import path from 'path';

// Функция для перемещения файла из одной директории в другую
const moveFile = (source, destination) => {
  fs.renameSync(source, destination);
};

// Функция для удаления файла
const deleteFile = (path) => {
  fs.unlinkSync(path);
};

/**
 * Функция для обработки изображений при создании новости
 */
export const moveCoverImg = (tempImagePath, permanentImagePath) => {
  // Перемещаем изображение из временной папки в постоянную
  moveFile(tempImagePath, permanentImagePath);

  // Получаем путь к директории изображения
  const imageDir = path.dirname(tempImagePath);

  // Получаем имя файла без расширения
  const filenameWithoutExt = path.basename(tempImagePath, path.extname(tempImagePath));

  // Получаем список файлов в директории
  const files = fs.readdirSync(imageDir);

  // Фильтруем файлы, чтобы оставить только модификации текущего изображения
  const modifications = files.filter(file => file.startsWith(filenameWithoutExt) && file !== filenameWithoutExt);

  // Перемещаем каждую модификацию изображения из временной папки в постоянную
  modifications.forEach(modification => {
    const modificationTempPath = path.join(imageDir, modification);
    const modificationPermanentPath = path.join(path.dirname(permanentImagePath), modification);
    moveFile(modificationTempPath, modificationPermanentPath);
  });
  // Удаляем изображение из временной папки
  //deleteFile(tempImagePath);
};

/**
 * Функция для обработки изображений при редактировании новости
 */
export const handleImageUpdate = (newTempImagePath, oldPermanentImagePath) => {
  // Если новое изображение было загружено, обновляем изображение
  if (newTempImagePath) {
    // Перемещаем новое изображение из временной папки в постоянную
    moveFile(newTempImagePath, oldPermanentImagePath);
    // Удаляем старое изображение
    // deleteFile(oldPermanentImagePath);
  }
  // Если новое изображение не было загружено, оставляем старое без изменений
};
