import { logger } from './logger.js';

const memStore = {};

const withMemStore = (id) => {
  const value = memStore[id];

  const getValue = () => memStore[id];

  const updateValue = (data, deleteAll) => {
    if (deleteAll) {
      logger.debug({ id }, `withMemStore: index ${id} deleted`);
      return delete memStore[id];
    }
    if (!memStore[id]) {
      memStore[id] = {};
    }
    memStore[id] = { ...memStore[id], ...data };
    logger.debug({ data }, `withMemStore: value updated for ${id}`);
  };

  return { value, getValue, updateValue };
};

export { withMemStore };
