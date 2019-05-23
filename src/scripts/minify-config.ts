import 'colors';
import * as path from 'path';
import {writefile, withoutKeys} from 'src/utils';
import {assertValidConfiguration} from 'test/config-assert';

import * as CONFIGS from 'static/config.json';

import {ConfigType} from '../types';

// @MARK: Path Constants
const CWD = process.cwd();
const OUTPUT_PATH = path.join(CWD, 'dist');
const OUTPUT_CONFIG_PATH = path.join(OUTPUT_PATH, 'config.min.json');

// @MARK: Configuration
const TYPED_CONFIGS = <ConfigType> CONFIGS;

// @MARK: Main
(async () => {
  try {
    assertValidConfiguration(TYPED_CONFIGS);
    const minifiedJSON = withoutKeys(['diff', 'from', 'to'], TYPED_CONFIGS);
    await writefile(OUTPUT_CONFIG_PATH, JSON.stringify(minifiedJSON));
    console.log(`✅ '${path.basename(OUTPUT_CONFIG_PATH)}' file is now minfified.`);
  } catch (e) {
    console.error(e.message.red);
    process.exit(1);
  }
})();
