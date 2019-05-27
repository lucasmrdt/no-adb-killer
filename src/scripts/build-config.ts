import * as nodeDiff from 'fast-diff';
import * as path from 'path';
import {readfile, writefile, fetchText, withoutKeys} from 'src/utils';
import {assertValidConfiguration} from 'test/config-assert';

import * as CONFIG from 'static/config.json';

import {
  ConfigType,
  ConfigItemType,
  RedirectItemType,
  ReplaceItemType,
} from '../types';

// @MARK: Path Constants
const CWD = process.cwd();
const STATIC_PATH = path.join(CWD, 'static');
const SCRIPT_PATH = path.join(STATIC_PATH, 'chrome/scripts');
const OUTPUT_CONFIG_PATH = path.join(STATIC_PATH, 'config.build.json');

// @MARK: Configuration
const TYPED_CONFIGS = <ConfigType> CONFIG;

// @MARK: Getters/Setters
const getJSONConfigItem = (name: string) => {
  const found = TYPED_CONFIGS.find(item => item.name === name);
  if (found === undefined) {
    throw new Error(`Config of '${name}' is unfound.`);
  }
  return found;
};

const setJSONConfigItem = (name: string, value: ConfigItemType) => {
  const index = TYPED_CONFIGS.findIndex(item => item.name === name);
  if (index === -1) {
    throw new Error(`Config of '${name}' is unfound.`);
  }
  TYPED_CONFIGS[index] = value;
};

// @MARK: Actions Handlers
const replaceAction = async (item: ReplaceItemType, oldScript: string) => {
  const {from, to} = item;
  const pattern = new RegExp(from, 'g');
  const newScript = oldScript.replace(pattern, to);
  const scriptName = `${item.name}.js`;
  const scriptPath = path.join(SCRIPT_PATH, scriptName);
  await writefile(scriptPath, newScript);

  // @XXX 'replace' => 'redirect'
  const redirectConfig: RedirectItemType = {
    ...withoutKeys(['from', 'to'], item),
    action: 'redirect',
    diff: nodeDiff(oldScript, newScript),
    target: scriptName,
  };
  setJSONConfigItem(item.name, redirectConfig);
};

const redirectAction = async (item: RedirectItemType, oldScript: string) => {
  const scriptPath = path.join(SCRIPT_PATH, item.target);
  const newScript = await readfile(scriptPath);
  const JSONItem = getJSONConfigItem(item.name);
  JSONItem.diff = nodeDiff(oldScript, newScript);
};

const buildConfig = async (config: ConfigItemType) => {
  const oldScript = await fetchText(config.url);

  const ACTIONS = {
    replace: replaceAction,
    redirect: redirectAction,
    cancel: () => {},
  };

  const selectedAction = ACTIONS[config.action];
  if (selectedAction) {
    try {
      // @ts-ignore
      await selectedAction(config, oldScript);
    } catch (e) {
      throw new Error(`Invalid config for '${config.name}', verify your configuration.\n${e}`);
    }
  } else {
    throw new Error(`Unknown action named '${config.action}' of '${config.name}' script.`);
  }
};

// @MARK: Main
(async () => {
  try {
    assertValidConfiguration(TYPED_CONFIGS);
    const promises = TYPED_CONFIGS.map(buildConfig);
    await Promise.all(promises);
    await writefile(OUTPUT_CONFIG_PATH, JSON.stringify(TYPED_CONFIGS));
    console.log(`✅ '${path.basename(OUTPUT_CONFIG_PATH)}' file is now ready.`);
  } catch (e) {
    console.error(e.message.red);
    process.exit(1);
  }
})();
