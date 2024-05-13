import path from 'path';
import prisma from '../prisma/prisma-client.js';
import { slugify } from 'transliteration';
import deleteCoverImg from '../utils/delete-cover-img.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { moveCoverImg } from '../utils/move-cover-img.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 *
 @route GET /api/promo-banners/
 @desc Получение всех промо-баннеров
 @access Public or Private
 */
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      searchQuery = '', // 1. Добавление параметра поиска по заголовку
      sortField = 'created_at', // Поле сортировки по умолчанию
      sortOrder = 'desc',
    } = req.query;

    const pageSizeInt = parseInt(pageSize, 10);
    const skip = (page - 1) * pageSizeInt;

    const where = {
      deleted: false,
    };

    // Добавляем поиск по заголовку
    if (searchQuery) {
      where.title = {
        contains: searchQuery,
      };
    }

    const totalCount = await prisma.promoBanner.count({
      where,
    });

    const promoBanners = await prisma.promoBanner.findMany({
      where,
      skip,
      take: pageSizeInt,
      orderBy: [
        { is_main: 'desc' }, // Первыми будут идти промо-баннеры с is_main равным true
        { [sortField]: sortOrder },
      ],
    });

    res.status(200).json({
      promoBanners,
      total: totalCount,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Не удалось получить промо-баннеры: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route GET /api/promo-banners/main
 @desc Получение активного промо-баннера
 @access Public
 */
export const getMain = async (req, res) => {
  try {
    // Находим активный промо-баннер
    const activePromoBanner = await prisma.promoBanner.findFirst({
      where: {
        is_main: true,
        deleted: false,
      },
    });

    if (!activePromoBanner) {
      return res.status(404).json({
        message: 'Активный промо-баннер не найден',
      });
    }

    return res.status(200).json(activePromoBanner);
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось получить активный промо-баннер: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route PUT /api/promo-banners/set-main/:id
 @desc Сделать конкретный промо-баннер главным
 @access Private
 */
export const setMain = async (req, res) => {
  try {
    const { id } = req.params;

    // Снимаем активный статус со всех промо-баннеров
    await prisma.promoBanner.updateMany({
      where: {
        is_main: true,
      },
      data: {
        is_main: false,
      },
    });

    // Устанавливаем выбранный баннер как активный
    await prisma.promoBanner.update({
      where: {
        id,
        deleted: false,
      },
      data: {
        is_main: true,
        updated: true,
        updated_at: new Date(),
        updated_by: req.admin.id,
      },
    });

    return res.status(200).json({
      message: 'Промо-баннер успешно сделан главным',
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось сделать промо-баннер главным: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route GET /api/promo-banners/:id
 @desc Получение промо-баннера
 @access Public or Private
 */
export const getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const promoBanner = await prisma.promoBanner.findUnique({
      where: {
        id,
        deleted: false,
      },
    });

    if (!promoBanner) {
      return res.status(404).json({
        message: 'Промо-баннер не найден',
      });
    }

    return res.status(200).json(promoBanner);
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось получить промо-баннер: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route POST /api/promo-banners/create
 @desc Добавление нового промо-баннера
 @access Private
 */
export const create = async (req, res) => {
  try {
    const data = req.body;

    /*// Сначала снимаем активный статус с текущего активного баннера, если он есть
    await prisma.promoBanner.updateMany({
      where: {
        is_main: true,
      },
      data: {
        is_main: false,
      },
    });*/

    const tempImagePath = data.image;
    const permanentImagePath = tempImagePath.replace('temp/', '')
    moveCoverImg(tempImagePath, permanentImagePath);

    // Затем создаем новый баннер, который будет активным
    const promoBanner = await prisma.promoBanner.create({
      data: {
        created_at: new Date(),
        created_by: req.admin.id,
        meta_title: data.metaTitle || data.title,
        title: data.title,
        description: data.description,
        image: permanentImagePath,
        url: data.url || null,
      },
    });

    return res.status(201).json(promoBanner);
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось добавить промо-баннер: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route PUT /api/promo-banners/update/:id
 @desc Редактирование промо-баннера
 @access Private
 */
export const update = async (req, res) => {
  try {
    const data = req.body;
    const { id } = data;

    // Получение текущей категории новости
    const currentPromoBanner = await prisma.promoBanner.findUnique({
      where: {
        id
      }
    });

    let newImagePath = data.path;

    if (currentPromoBanner.image !== data.image) {
      const tempImagePath = data.image;
      const permanentImagePath = tempImagePath.replace('temp/', '');
      newImagePath = permanentImagePath;
      moveCoverImg(tempImagePath, permanentImagePath);

      // удаляем текущую обложку
      // const currentImagePath = path.join(__dirname, '..', currentNewsPost.image);
      // console.log('imagePathimagePathimagePathimagePath', currentImagePath)
      // deleteCoverImg(currentImagePath);
    }

    await prisma.promoBanner.update({
      where: {
        id,
        deleted: false,
      },
      data: {
        meta_title: data.metaTitle || data.title,
        title: data.title,
        description: data.description,
        image: newImagePath,
        url: data.url || null,
        updated: true,
        updated_at: new Date(),
        updated_by: req.admin.id,
      },
    });

    return res.status(200).json({
      message: 'Промо-баннер успешно обновлен',
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось отредактировать промо-баннер: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route PUT /api/promo-banners/remove/:id
 @desc Удаление промо-баннера
 @access Private
 */
export const softRemove = async (req, res) => {
  try {
    const { id } = req.body;

    // Получаем информацию о промо-баннере
    const existingPromoBanner = await prisma.promoBanner.findUnique({
      where: {
        id,
        deleted: false,
      },
    });

    if (!existingPromoBanner) {
      return res.status(404).json({
        message: 'Промо-баннер не найден',
      });
    }

    await prisma.promoBanner.update({
      where: {
        id,
      },
      data: {
        deleted: true,
        updated: true,
        updated_at: new Date(),
        updated_by: req.admin.id,
      },
    });

    return res.status(200).json({
      message: 'Промо-баннер успешно удален',
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось удалить промо-баннер: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route POST /api/promo-banners/remove-hard/:id
 @desc Удаление промо-баннера безвозвратно
 @access Private
 */
export const hardRemove = async (req, res) => {
  try {
    const { id } = req.body;

    // Получаем информацию о промо-баннере
    const promoBanner = await prisma.promoBanner.findUnique({
      where: {
        id,
      },
    });

    if (!promoBanner) {
      return res.status(404).json({
        message: 'Промо-баннер не найден',
      });
    }

    // Удаляем файл обложки
    const imagePath = path.join(__dirname, '..', promoBanner.image);
    const imageThumbPath = path.join(
      __dirname,
      '..',
      `${promoBanner.image.split('.')[0]}-thumb.${promoBanner.image
        .split('.')
        .pop()}`
    );
    deleteCoverImg(imagePath);
    deleteCoverImg(imageThumbPath);

    await prisma.promoBanner.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      message: 'Промо-баннер успешно безвозвратно удален',
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось безвозвратно удалить промо-баннер: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};
