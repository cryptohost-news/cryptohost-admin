import fs from 'fs';
import path from 'path';

// export default (imagePath) => {
//   // Проверяем, существует ли файл
//   if (fs.existsSync(imagePath)) {
//     // Удаляем файл
//     fs.unlinkSync(imagePath);
//     console.log(`Файл обложки удален: ${imagePath}`);
//   } else {
//     console.log(`Файл обложки не найден: ${imagePath}`);
//   }
// };

export default (originalImagePath) => {
  // Получаем путь к директории изображения
  const imageDir = path.dirname(originalImagePath);

  // Получаем имя файла без расширения
  const filenameWithoutExt = path.basename(originalImagePath, path.extname(originalImagePath));

  // Получаем список файлов в директории
  const files = fs.readdirSync(imageDir);

  // Фильтруем файлы, чтобы оставить только модификации текущего изображения
  const modifications = files.filter(file => file.startsWith(filenameWithoutExt) && file !== filenameWithoutExt);

  // Удаляем каждую модификацию изображения
  modifications.forEach(modification => {
    const modificationPath = path.join(imageDir, modification);
    if (fs.existsSync(modificationPath)) {
      fs.unlinkSync(modificationPath);
      console.log(`Модификация изображения удалена: ${modificationPath}`);
    } else {
      console.log(`Модификация изображения не найдена: ${modificationPath}`);
    }
  });
};
