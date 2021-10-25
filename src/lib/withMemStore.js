const memStore = {};

const withMemStore = (id) => {
  const value = memStore[id];

  const getValue = () => memStore[id];

  const updateValue = (data, deleteAll) => {
    if (deleteAll) {
      return delete memStore[id];
    }
    if (!memStore[id]) {
      memStore[id] = {};
    }
    memStore[id] = { ...memStore[id], ...data };
  };

  return { value, getValue, updateValue };
};

export { withMemStore };
