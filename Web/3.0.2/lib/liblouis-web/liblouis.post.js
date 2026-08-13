/* This file is appended to Emscripten's modularized ES module output. */
Module.liblouis = (() => {
  let initialized = false;

  const lastError = () => Module.ccall('ll_last_error', 'string');

  const setDataPath = (path = '/tables') => {
    const success = Module.ccall(
      'll_set_data_path',
      'number',
      ['string'],
      [path],
    );
    if (!success) throw new Error(lastError() || 'Could not set the liblouis table path.');
    initialized = true;
  };

  const translate = ({ table = 'ko-g2.ctb', text, direction = 'forward' } = {}) => {
    if (typeof text !== 'string') throw new TypeError('text must be a string.');
    if (direction !== 'forward' && direction !== 'backward') {
      throw new TypeError("direction must be 'forward' or 'backward'.");
    }
    if (!initialized) setDataPath();

    const result = Module.ccall(
      'll_translate',
      'string',
      ['string', 'string', 'number'],
      [table, text, direction === 'backward' ? 1 : 0],
    );
    if (result === null) throw new Error(lastError() || 'liblouis translation failed.');
    return result;
  };

  return { setDataPath, translate };
})();
