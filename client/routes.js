import 'dotenv/config';

export const baseUrl = process.env.SERVER_URL;
export const clientDomain = process.env.SERVER_URL;
export const extUrl = process.env.CLIENT_DOMAIN; // TODO поменять URL

const apiPath = 'api';

export default {
  // Auth
  adminLogin: () => [baseUrl, apiPath, 'admin', 'login'].join('/'),
  adminRegister: () => [baseUrl, apiPath, 'admin', 'register'].join('/'),
  adminCurrent: () => [baseUrl, apiPath, 'current'].join('/'),

  // CRUD
  getAll: (pathname) => [baseUrl, apiPath, pathname].join('/'),
  getOne: (pathname, id) => [baseUrl, apiPath, pathname, id].join('/'),
  create: (pathname) => [baseUrl, apiPath, pathname, 'create'].join('/'),
  update: (pathname, id) => [baseUrl, apiPath, pathname, 'update', id].join('/'),
  remove: (pathname, id) => [baseUrl, apiPath, pathname, 'remove-hard', id].join('/'),
  getAllPublic: (pathname) => [baseUrl, apiPath, pathname, 'public'].join('/'),

  setMain: (pathname, id) => [baseUrl, apiPath, pathname, 'set-main', id].join('/'),

  // Common
  upload: (entityName) => [baseUrl, apiPath, 'upload', entityName].join('/'),
};
