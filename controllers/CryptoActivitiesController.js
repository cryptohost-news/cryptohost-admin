import path from 'path';
import prisma from '../prisma/prisma-client.js';
import { slugify } from 'transliteration';
import deleteCoverImg from '../utils/delete-cover-img.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import getPreviewFromBody from '../utils/get-preview-from-body.js';
import { moveCoverImg } from '../utils/move-cover-img.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 *
 @route GET /api/crypto-activities/paths
 @desc Получение всех путей
 @access Public
 */
export const getPaths = async (req, res) => {
  try {
    const cryptoActivities = await prisma.cryptoActivity.findMany({
      select: {
        slug: true,
      },
    });

    // Преобразуем полученные слаги в массив объектов с параметром slug для каждого пути
    const paths = cryptoActivities.map((post) => ({
      params: {
        slug: post.slug,
      },
    }));

    return res.status(200).json(paths);
  } catch (error) {
    return res.status(400).json({
      message: `Не удалось получить пути криптоактивностей: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route GET /api/crypto-activities/
 @desc Получение всех криптоактивностей
 @access Public or Private
 */
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      excludeIds = '[]',
      searchQuery = '', // 1. Добавление параметра поиска по заголовку
      sortField = 'created_at', // Поле сортировки по умолчанию
      sortOrder = 'desc', // Направление сортировки по умолчанию
    } = req.query;

    const pageSizeInt = parseInt(pageSize, 10);
    const skip = (page - 1) * pageSizeInt;

    const where = {
      deleted: false,
    };

    // Делаем это для того, чтобы total не реагировал исключенные посты
    const totalCountWhere = { ...where };

    // Добавляем исключение постов, если excludeIds указаны
    if (JSON.parse(excludeIds).length > 0) {
      where.NOT = {
        id: {
          in: JSON.parse(excludeIds),
        },
      };
    }

    // Добавляем поиск по заголовку
    if (searchQuery) {
      where.title = {
        contains: searchQuery,
        // mode: 'insensitive', // Регистронезависимый поиск
      };
      totalCountWhere.title = {
        contains: searchQuery,
      };
    }

    const totalCount = await prisma.cryptoActivity.count({
      where: totalCountWhere,
    });

    const cryptoActivityPosts = await prisma.cryptoActivity.findMany({
      where,
      skip,
      take: pageSizeInt,
      orderBy: {
        [sortField]: sortOrder,
      },
      // Отдаем только те поля, который нужны
      select: {
        id: true,
        meta_title: true,
        title: true,
        published_at: true,
        image: true,
        slug: true,
        body: true,
        views: true,
      },
    });

    // Проход по каждой статье и создание поля description
    // Очищается разметка Markdown и отдается только заданное количество символов.
    cryptoActivityPosts.forEach((post) => {
      post.description = `${getPreviewFromBody(post.body, 100)} ...`;
      delete post.body;
    });

    res.status(200).json({
      activities: cryptoActivityPosts,
      total: totalCount,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Не удалось получить криптоактивности: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route GET /api/crypto-activities/:id
 @desc Получение одной криптоактивности
 @access Public or Private
 */
export const getOne = async (req, res) => {
  try {
    const { id, slug } = req.params;

    let cryptoActivityPost;

    if (id) {
      cryptoActivityPost = await prisma.cryptoActivity.findUnique({
        where: {
          id,
        },
      });
    } else if (slug) {
      cryptoActivityPost = await prisma.cryptoActivity.findUnique({
        where: {
          slug,
        },
      });
    }

    // const cryptoActivityPost = await prisma.cryptoActivity.findUnique({
    //   where: {
    //     id,
    //   },
    // });

    if (!cryptoActivityPost) {
      return res.status(404).json({ message: 'Криптоактивность не найдена' });
    }

    // Увеличение счетчика просмотров на 1
    if (id) {
      await prisma.cryptoActivity.update({
        where: { id },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    } else if (slug) {
      await prisma.cryptoActivity.update({
        where: { slug },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }

    return res.status(200).json(cryptoActivityPost);
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось получить криптоактивность: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route POST /api/crypto-activities/create
 @desc Добавление новой криптоактивности
 @access Private
 */
export const create = async (req, res) => {
  try {
    const data = req.body;
    // publishedAt по умолчанию ставится текущая дата, но если изменено, то указанная дата
    // const { metaTitle, title, categoryId, publishedAt, image, body } = data;

    const tempImagePath = data.image;
    const permanentImagePath = tempImagePath.replace('temp/', '')
    moveCoverImg(tempImagePath, permanentImagePath);

    let currentSlug = slugify(data.title);

    const cryptoActivityPostWithSameSlug =
      await prisma.cryptoActivity.findFirst({
        where: {
          slug: currentSlug,
          deleted: false,
        },
      });

    if (cryptoActivityPostWithSameSlug) {
      // Если криптоактивность с таким слагом уже есть, то добавляем в конце сегодняшнюю дату
      currentSlug = `${currentSlug}-${Date.now()}`;
    }

    const cryptoActivityPost = await prisma.cryptoActivity.create({
      data: {
        meta_title: data.metaTitle || data.title,
        title: data.title,
        created_at: new Date(),
        created_by: req.admin.id,
        published_at: data.publishedAt
          ? new Date(data.publishedAt)
          : new Date(),
        image: permanentImagePath,
        slug: currentSlug,
        body: data.body,
      },
    });

    return res.status(201).json(cryptoActivityPost);
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось добавить криптоактивность: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route PUT /api/crypto-activities/update/:id
 @desc Редактирование криптоактивности
 @access Private
 */
export const update = async (req, res) => {
  try {
    const data = req.body;
    const { id } = data;

    let currentSlug = slugify(data.title);

    const cryptoActivityPostWithSameSlug = await prisma.newsPost.findFirst({
      where: {
        slug: currentSlug,
        deleted: false,
      },
    });

    if (cryptoActivityPostWithSameSlug  && cryptoActivityPostWithSameSlug.id !== id) {
      // Если новость с таким слагом уже есть, то добавляем в конце сегодняшнюю дату
      currentSlug = `${currentSlug}-${Date.now()}`;
    }

    const currentCryptoActivity = await prisma.cryptoActivity.findUnique({
      where: {
        id
      },
    });

    let newImagePath = data.path;

    if (currentCryptoActivity.image !== data.image) {
      const tempImagePath = data.image;
      const permanentImagePath = tempImagePath.replace('temp/', '');
      newImagePath = permanentImagePath;
      moveCoverImg(tempImagePath, permanentImagePath);

      // удаляем текущую обложку
      // const currentImagePath = path.join(__dirname, '..', currentNewsPost.image);
      // console.log('imagePathimagePathimagePathimagePath', currentImagePath)
      // deleteCoverImg(currentImagePath);
    }

    await prisma.cryptoActivity.update({
      where: {
        id,
        deleted: false,
      },
      data: {
        meta_title: data.metaTitle || data.title,
        title: data.title,
        image: newImagePath,
        published_at: data.publishedAt,
        slug: currentSlug,
        body: data.body,
        updated: true,
        updated_at: new Date(),
        updated_by: req.admin.id,
      },
    });

    return res.status(200).json({
      message: 'Криптоактивность успешно обновлена',
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось отредактировать криптоактивность: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route PUT /api/crypto-activities/remove/:id
 @desc Удаление криптоактивности
 @access Private
 */
export const softRemove = async (req, res) => {
  try {
    const { id } = req.body;

    // Получаем информацию о новости
    const cryptoActivityPost = await prisma.cryptoActivity.findUnique({
      where: {
        id,
        deleted: false,
      },
    });

    if (!cryptoActivityPost) {
      return res.status(404).json({
        message: 'Криптоактивность не найдена',
      });
    }

    await prisma.cryptoActivity.update({
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
      message: 'Криптоактивность успешно удалена',
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось удалить криптоактивность: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route POST /api/crypto-activities/remove-hard/:id
 @desc Удаление криптоактивности безвозвратно
 @access Private
 */
export const hardRemove = async (req, res) => {
  try {
    const { id } = req.body;

    // Получаем информацию о новости
    const cryptoActivityPost = await prisma.cryptoActivity.findUnique({
      where: {
        id,
      },
    });

    if (!cryptoActivityPost) {
      return res.status(404).json({
        message: 'Криптоактивность не найдена',
      });
    }

    // Удаляем файл обложки
    const imagePath = path.join(__dirname, '..', cryptoActivityPost.image);
    const imageThumbPath = path.join(
      __dirname,
      '..',
      `${
        cryptoActivityPost.image.split('.')[0]
      }-thumb.${cryptoActivityPost.image.split('.').pop()}`
    );
    deleteCoverImg(imagePath);
    deleteCoverImg(imageThumbPath);

    await prisma.cryptoActivity.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      message: 'Криптоактивность успешно удалена безвозвратно',
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось безвозвратно удалить криптоактивность: ${error}`,
    });
  } finally {
    await prisma.$disconnect();
  }
};
