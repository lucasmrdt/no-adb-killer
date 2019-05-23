import 'colors';
import * as chrome from 'chrome-webstore-upload';
import * as zipFolder from 'zip-folder';
import * as path from 'path';
import * as fs from 'fs';

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

(async () => {
  assertEnvironment();

  const webStore = chrome({
    extensionId: process.env.EXTENSION_ID,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  });

  await zip(CHROME_PATH, OUTPUT_PATH);
  const extensionSource = fs.createReadStream(OUTPUT_PATH);
  await webStore.uploadExisting(extensionSource);
})();
