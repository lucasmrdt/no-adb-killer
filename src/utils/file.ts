import * as fs from 'fs';

export const writefile = (path, file) => new Promise((res, rej) => (
  fs.writeFile(path, file, {encoding: 'utf8'}, e => e ? rej(e) : res())
));

export const readfile = (path): Promise<string> => new Promise((res, rej) => (
  fs.readFile(path, {encoding: 'utf8'}, (e, content) => e ? rej(e) : res(content))
));