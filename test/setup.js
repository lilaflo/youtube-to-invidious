// Mock chrome.storage API
global.chrome = {
  storage: {
    sync: {
      get: (keys, callback) => {
        callback({ debugEnabled: false });
      },
      set: (data, callback) => {
        if (callback) callback();
      }
    }
  },
  runtime: {
    lastError: null
  }
};
