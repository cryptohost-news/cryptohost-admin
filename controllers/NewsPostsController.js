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
 @route GET /api/news-posts/paths
 @desc Получение всех путей
 @access Public
 */
export const getPaths = async (req, res) => {
  try {
    const newsPosts = await prisma.newsPost.findMany({
      select: {
        slug: true
      }
    });

    // Преобразуем полученные слаги в массив объектов с параметром slug для каждого пути
    const paths = newsPosts.map((post) => ({
      params: {
        slug: post.slug
      }
    }));

    return res.status(200).json(paths);
  } catch (error) {
    return res.status(400).json({
      message: `Не удалось получить пути новостей: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route GET /api/news-posts/
 @desc Получение всех новостей
 @access Public or Private
 */
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      categoryIds = '[]',
      excludeIds = '[]',
      searchQuery = '', // 1. Добавление параметра поиска по заголовку
      sortField = 'published_at', // Поле сортировки по умолчанию
      sortOrder = 'desc' // Направление сортировки по умолчанию
    } = req.query;

    const pageSizeInt = parseInt(pageSize, 10);
    const skip = (page - 1) * pageSizeInt;

    const where = {
      deleted: false
    };

    // Делаем это для того, чтобы total не реагировал исключенные посты
    const totalCountWhere = { ...where };

    // Добавляем фильтрацию по категориям, если categoryIds указаны
    if (JSON.parse(categoryIds).length > 0) {
      where.category_id = {
        in: JSON.parse(categoryIds)
      };
      totalCountWhere.category_id = {
        in: JSON.parse(categoryIds)
      };
    }

    // Добавляем исключение постов, если excludeIds указаны
    if (JSON.parse(excludeIds).length > 0) {
      where.NOT = {
        id: {
          in: JSON.parse(excludeIds)
        }
      };
    }
    // Добавляем поиск по заголовку
    if (searchQuery) {
      where.title = {
        contains: searchQuery
        // mode: 'insensitive', // Регистронезависимый поиск
      };
      totalCountWhere.title = {
        contains: searchQuery
      };
    }

    const totalCount = await prisma.newsPost.count({
      where: totalCountWhere
    });

    const newsPosts = await prisma.newsPost.findMany({
      where,
      skip,
      take: pageSizeInt,
      orderBy: {
        [sortField]: sortOrder // 2. Добавление сортировки по выбранному полю и направлению
      },
      /*      include: {
              category: true,
            },*/
      // Отдаем только те поля, который нужны
      select: {
        id: true,
        meta_title: true,
        title: true,
        category_id: true,
        published_at: true,
        updated_at: true,
        image: true,
        slug: true,
        body: true,
        views: true,
        category: true
      }
    });

    // Проход по каждой статье и создание поля description
    // Очищается разметка Markdown и отдается только заданное количество символов.
    newsPosts.forEach((post) => {
      post.description = `${getPreviewFromBody(post.body, 400)} ...`;
      delete post.body;
    });

    res.status(200).json({
      posts: newsPosts,
      total: totalCount
    });
  } catch (error) {
    return res.status(400).json({
      message: `Не удалось получить новости: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route GET /api/news-posts/:id
 @desc Получение одной новости
 @access Public or Private
 */
export const getOne = async (req, res) => {
  try {
    const { id, slug } = req.params;

    console.log('req.paramsreq.paramsreq.paramsreq.params', req.params);

    let newsPost;

    if (id) {
      newsPost = await prisma.newsPost.findUnique({
        where: {
          id
        },
        include: {
          category: true
        }
      });
    } else if (slug) {
      newsPost = await prisma.newsPost.findUnique({
        where: {
          slug
        },
        include: {
          category: true
        }
      });
    }

    /*const newsPost = await prisma.newsPost.findUnique({
      where: {
        id,
      },
    });*/

    if (!newsPost) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    // // Увеличение счетчика просмотров на 1
    // await prisma.newsPost.update({
    //   where: { id },
    //   data: {
    //     views: {
    //       increment: 1,
    //     },
    //   },
    // });

    // Увеличение счетчика просмотров на 1
    if (id) {
      await prisma.newsPost.update({
        where: { id },
        data: {
          views: {
            increment: 1
          }
        }
      });
    } else if (slug) {
      await prisma.newsPost.update({
        where: { slug },
        data: {
          views: {
            increment: 1
          }
        }
      });
    }

    newsPost.description = `${getPreviewFromBody(newsPost.body, 400)} ...`;

    return res.status(200).json(newsPost);
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось получить новость: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route POST /api/news-posts/create
 @desc Добавление новой новости
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

    const createdNewsPost = await prisma.newsPost.findFirst({
      where: {
        slug: currentSlug,
        deleted: false
      }
    });

    if (createdNewsPost) {
      // Если новость с таким слагом уже есть, то добавляем в конце сегодняшнюю дату
      currentSlug = `${currentSlug}-${Date.now()}`;
    }

    const newsPost = await prisma.newsPost.create({
      include: {
        // нужно загрузить связанную категорию, которая указана в модели:
        // category     NewsCategory @relation(fields: [category_id], references: [id])
        category: true
      },
      data: {
        meta_title: data.metaTitle || data.title,
        title: data.title,
        category_id: data.categoryId,
        created_at: new Date(),
        created_by: req.admin.id,
        published_at: data.publishedAt
          ? new Date(data.publishedAt)
          : new Date(),
        image: permanentImagePath,
        slug: currentSlug,
        body: data.body
      }
    });

    // Увеличение счетчика в соответствующей категории
    await prisma.newsCategory.update({
      where: {
        id: data.categoryId
      },
      data: {
        posts_count: {
          increment: 1
        }
      }
    });

    return res.status(201).json(newsPost);
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось добавить новость: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route PUT /api/news-posts/update/:id
 @desc Редактирование новости
 @access Private
 */
export const update = async (req, res) => {
  try {
    const data = req.body;
    const { id, categoryId: newCategoryId } = data;

    let currentSlug = slugify(data.title);

    const newsPostWithSameSlug = await prisma.newsPost.findFirst({
      where: {
        slug: currentSlug,
        deleted: false
      }
    });

    if (newsPostWithSameSlug && newsPostWithSameSlug.id !== id) {
      // Если новость с таким слагом уже есть, то добавляем в конце сегодняшнюю дату
      currentSlug = `${currentSlug}-${Date.now()}`;
    }

    // Получение текущей категории новости
    const currentNewsPost = await prisma.newsPost.findUnique({
      where: {
        id
      },
      select: {
        category_id: true
      }
    });

    let newImagePath = data.path;

    if (currentNewsPost.image !== data.image) {
      const tempImagePath = data.image;
      const permanentImagePath = tempImagePath.replace('temp/', '');
      newImagePath = permanentImagePath;
      moveCoverImg(tempImagePath, permanentImagePath);

      // удаляем текущую обложку
      // const currentImagePath = path.join(__dirname, '..', currentNewsPost.image);
      // console.log('imagePathimagePathimagePathimagePath', currentImagePath)
      // deleteCoverImg(currentImagePath);
    }


    // Если категория изменена, увеличение счетчика в новой категории
    if (currentNewsPost.category_id !== newCategoryId) {
      await prisma.newsCategory.update({
        where: {
          id: newCategoryId
        },
        data: {
          posts_count: {
            increment: 1
          }
        }
      });

      // Уменьшение счетчика в текущей категории
      await prisma.newsCategory.update({
        where: {
          id: currentNewsPost.category_id
        },
        data: {
          posts_count: {
            decrement: 1
          }
        }
      });
    }

    await prisma.newsPost.update({
      where: {
        id,
        deleted: false
      },
      data: {
        meta_title: data.metaTitle || data.title,
        title: data.title,
        published_at: data.publishedAt,
        category_id: data.categoryId,
        image: newImagePath,
        slug: currentSlug,
        body: data.body,
        updated: true,
        updated_at: new Date(),
        updated_by: req.admin.id
      }
    });

    return res.status(200).json({
      message: 'Новость успешно обновлена'
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось отредактировать новость: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route PUT /api/news-posts/remove/:id
 @desc Удаление новости
 @access Private
 */
export const softRemove = async (req, res) => {
  try {
    const { id } = req.body;

    // Получаем информацию о новости
    const newsPost = await prisma.newsPost.findUnique({
      where: {
        id,
        deleted: false
      }
    });

    if (!newsPost) {
      return res.status(404).json({
        message: 'Новость не найдена'
      });
    }

    // Получение категории текущей новости
    const currentNewsPost = await prisma.newsPost.findUnique({
      where: {
        id
      },
      select: {
        category_id: true
      }
    });

    // Уменьшение счетчика в текущей категории
    await prisma.newsCategory.update({
      where: {
        id: currentNewsPost.category_id
      },
      data: {
        posts_count: {
          decrement: 1
        }
      }
    });

    await prisma.newsPost.update({
      where: {
        id
      },
      data: {
        deleted: true,
        updated: true,
        updated_at: new Date(),
        updated_by: req.admin.id
      }
    });

    return res.status(200).json({
      message: 'Новость успешно удалена'
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось удалить новость: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 *
 @route POST /api/news-posts/remove-hard/:id
 @desc Удаление новости безвозвратно
 @access Private
 */
export const hardRemove = async (req, res) => {
  try {
    const { id } = req.body;

    // Получаем информацию о новости
    const newsPost = await prisma.newsPost.findUnique({
      where: {
        id
      }
    });

    if (!newsPost) {
      return res.status(404).json({
        message: 'Новость не найдена'
      });
    }

    // Удаляем файл обложки
    const imagePath = path.join(__dirname, '..', newsPost.image);
    const imageThumbPath = path.join(
      __dirname,
      '..',
      `${newsPost.image.split('.')[0]}-thumb.${newsPost.image.split('.').pop()}`
    );
    deleteCoverImg(imagePath);
    deleteCoverImg(imageThumbPath);

    // Получение категории текущей новости
    const currentNewsPost = await prisma.newsPost.findUnique({
      where: {
        id
      },
      select: {
        category_id: true
      }
    });

    // Уменьшение счетчика в текущей категории
    await prisma.newsCategory.update({
      where: {
        id: currentNewsPost.category_id
      },
      data: {
        posts_count: {
          decrement: 1
        }
      }
    });

    await prisma.newsPost.delete({
      where: {
        id
      }
    });

    return res.status(200).json({
      message: 'Новость успешно удалена безвозвратно'
    });
  } catch (error) {
    return res.status(500).json({
      message: `Не удалось безвозвратно удалить новость: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }
};
