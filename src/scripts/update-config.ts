import 'colors';
import * as nodeDiff from 'fast-diff';
import * as path from 'path';
import {readfile, writefile, fetchText} from 'src/utils';
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
const MAX_PART_LENGTH = 25;

// @MARK: Log
const displaySlicedValue = (value: string) => {
  if (value.length <= MAX_PART_LENGTH) {
    process.stdout.write(value.white);
    return;
  }
  process.stdout.write(value.slice(0, MAX_PART_LENGTH/2).white);
  process.stdout.write('[...]'.cyan);
  process.stdout.write(value.slice(-MAX_PART_LENGTH/2).white);
};

const displayDiff = (item: ConfigItemType, diff: nodeDiff.Diff[]) => {
  console.log(`🌀 This is your modifications on the '${item.domain}' script:`.bold);
  diff.forEach(part => {
    const [state, value] = part;
    if (state === nodeDiff.INSERT) {
      process.stdout.write(value.green);
    } else if (state === nodeDiff.DELETE) {
      process.stdout.write(value.red);
    } else {
       displaySlicedValue(value);
    }
  });
  process.stdout.write('\n\n');
};

// @MARK: Getters/Setters
const getJSONConfigItem = (domain: string) => {
  const found = TYPED_CONFIGS.find(item => item.domain === domain);
  if (found === undefined) {
    throw new Error(`Config of '${domain}' is unfound.`);
  }
  return found;
};

// @MARK: Actions Functions
const replaceAction = async (item: ReplaceItemType, oldScript: string) => {
  const {from, to} = item;
  const pattern = new RegExp(from, 'g');
  const newScript = oldScript.replace(pattern, to);
  const scriptName = `${item.domain}.js`;
  const scriptPath = path.join(SCRIPT_PATH, scriptName);
  await writefile(scriptPath, newScript);

  const JSONItem = <ReplaceItemType> getJSONConfigItem(item.domain);
  JSONItem.diff = nodeDiff(oldScript, newScript);

  displayDiff(item, JSONItem.diff);
};

const redirectAction = async (item: RedirectItemType, oldScript: string) => {
  const scriptPath = path.join(SCRIPT_PATH, item.target);
  const newScript = await readfile(scriptPath);
  const JSONItem = getJSONConfigItem(item.domain);
  JSONItem.diff = nodeDiff(oldScript, newScript);
  displayDiff(item, JSONItem.diff);
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
      throw new Error(`Invalid config for '${config.domain}', verify your configuration.\n${e}`);
    }
  } else {
    throw new Error(`Unknown action named '${config.action}' of '${config.domain}' script.`);
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
