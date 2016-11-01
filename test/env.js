/**
 * Script for require-ifying src files for use in tests.
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const BASE_PATH = path.resolve(path.join(__dirname, '..', 'src'));

const files = require('../script-manifest.json');

const context = vm.createContext(global);

Object.assign(context, {
  window: context,
  THREE: require('three'),
  Engine: null,
});

files.forEach(src => {
  const filename = path.join(BASE_PATH, src);
  const code = fs.readFileSync(filename, 'utf8');

  const script = new vm.Script(code, {
    filename: filename,
    displayErrors: true,
    timeout: 10,
  });

  script.runInContext(context)
});

module.exports = context;
