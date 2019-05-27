import 'colors';
import * as zipFolder from 'zip-folder';
import * as path from 'path';
import * as fs from 'fs';
import * as chrome from 'webstore-upload';

const CHROME_PATH = path.join(process.cwd(), 'app');
const OUTPUT_PATH = path.join(process.cwd(), 'app.zip');

const assertEnvironment = () => {
  const MUST_ENV_KEYS = ['EXTENSION_ID', 'CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN'];
  const ENV_KEYS = new Set(Object.keys(process.env));
  const KEYS = MUST_ENV_KEYS.filter(key => !ENV_KEYS.has(key));
  if (KEYS.length !== 0) {
    console.error(`Your environment must provides theses misted variables '${KEYS.join(', ')}'.`.red);
    process.exit(1);
  }
};

const zip = (inPath, outPath) => new Promise((res, rej) => (
  zipFolder(inPath, outPath, e => e ? rej(e) : res())
));

const rm = (path) => new Promise((res, rej) => (
  fs.unlink(path, e => e ? rej(e) : res())
));

(async () => {
  assertEnvironment();

  await zip(CHROME_PATH, OUTPUT_PATH);
  await chrome({
    accounts: {
      default: {
        publish: true,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: process.env.REFRESH_TOKEN,
      },
    },
    extensions: {
      'no-adb-killer': {
        appID: process.env.EXTENSION_ID,
        zip: OUTPUT_PATH,
      },
    },
  });
  await rm(OUTPUT_PATH);
})();
