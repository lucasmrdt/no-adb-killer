import * as fs from 'fs';

export const writefile = async (filePath: string, file: string) => {
  const directory = filePath.split('/').slice(0, -1).join('/');
  if (!fs.existsSync(directory)) {
    await fs.promises.mkdir(directory, {recursive: true});
  }
  return fs.promises.writeFile(filePath, file, {encoding: 'utf8'});
};

export const readfile = (filePath: string): Promise<string> => (
  fs.promises.readFile(filePath, {encoding: 'utf8'})
);
