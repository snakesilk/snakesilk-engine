#! /usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_PATH = path.resolve(path.join(__dirname, '..', 'src'));

const files = require('../script-manifest.json');

const content = files.map(src => {
    const filename = path.join(BASE_PATH, src);
    return fs.readFileSync(filename, 'utf8');
});

const code = content.reduce((code, block) => {
  return code + block + '\n';
}, '');

let output = `
const THREE = require('three');

let Engine;

${code}

module.exports = Engine;
`;

process.stdout.write(output);
