import 'colors';
import * as nodeDiff from 'fast-diff';
import * as path from 'path';
import {readfile, writefile, fetchText, withoutKeys} from 'src/utils';

import * as CONFIG from 'static/config.json';

import {
  ConfigType,
  ConfigItemType,
  RedirectItemType,
  ReplaceItemType,
  ActionType,
} from '../types';

// @MARK: Path Constants
const CWD = process.cwd();
const STATIC_PATH = path.join(CWD, 'static');
const OUTPUT_PATH = path.join(CWD, 'dist');
const SCRIPT_PATH = path.join(STATIC_PATH, 'chrome/scripts');
const OUTPUT_SCRIPT_PATH = path.join(OUTPUT_PATH, 'scripts');
const OUTPUT_CONFIG_PATH = path.join(STATIC_PATH, 'config.build.json');
const OUTPUT_MINIFIED_CONFIG_PATH = path.join(OUTPUT_PATH, 'config.min.json');

// @MARK: Configuration
const TYPED_CONFIG = <ConfigType> CONFIG;
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

// @MARK: Verify Configuration File
const DEFAULT_VERIFIER = {
  domain: String,
  pattern: String,
  action: new Set(['redirect', 'replace', 'cancel']),
};

const REPLACE_VERIFIER = {
  ...DEFAULT_VERIFIER,
  url: String,
  from: String,
  to: String,
};

const REDIRECT_VERIFIER = {
  ...DEFAULT_VERIFIER,
  url: String,
  target: String,
};

const CANCEL_VERIFIER = {
  ...DEFAULT_VERIFIER,
  url: String,
};

const VERIFIERS = {
  replace: REPLACE_VERIFIER,
  redirect: REDIRECT_VERIFIER,
  cancel: CANCEL_VERIFIER,
};

const configurationMatch = (config: ConfigItemType, matcher: object) => {
  const config_keys = new Set(Object.keys(config));
  const matcher_keys = new Set(Object.keys(matcher));

  const ERROR_LOCATION = `in config of '${config.domain || 'unknown'}'`;

  config_keys.forEach(key => {
    if (!matcher_keys.has(key)) {
      throw new Error(`Invalid key '${key}', it's not an accepted key for action '${config.action || 'unknown'}' ${ERROR_LOCATION}.`);
    }
  });

  matcher_keys.forEach(key => {
    const value_a = config[key];
    const value_b = matcher[key];
    if (value_a === undefined) {
      throw new Error(`Misted key '${key}' ${ERROR_LOCATION}.`);
    }
    if (typeof value_b === 'function' && typeof value_a !== typeof value_b()) {
      throw new Error(`Invalid type of '${key}', got '${typeof value_a}' but expected '${typeof value_b()}' ${ERROR_LOCATION}.`);
    }
    if (value_b instanceof Set && !value_b.has(value_a)) {
      const allowedValues = [...value_b].map(el => el).join(', ');
      throw new Error(`Invalid value of '${key}', got '${value_a}' but expected one of '${allowedValues}' ${ERROR_LOCATION}.`);
    }
  });
}

const verifyConfiguration = (config: ConfigType) => config.forEach(item => {
  const verifier = VERIFIERS[item.action];
  if (verifier === undefined) {
    throw new Error(`You must provide an 'action' key which equal to ('redirect', 'replace' or 'cancel')`);
  }
  configurationMatch(item, verifier);
});

// @MARK: Getters/Setters
const getJSONConfigItem = (domain: string) => {
  const found = TYPED_CONFIG.find(item => item.domain === domain);
  if (found === undefined) {
    throw new Error(`Config of '${domain}' is unfound.`);
  }
  return found;
};

const saveConfiguration = async () => {
  const minifiedJSON = withoutKeys(['diff', 'from', 'to', 'domain'], TYPED_CONFIG);
  await writefile(OUTPUT_CONFIG_PATH, JSON.stringify(TYPED_CONFIG));
  await writefile(OUTPUT_MINIFIED_CONFIG_PATH, JSON.stringify(minifiedJSON));
};

// @MARK: Actions Functions
const replaceAction = async (item: ReplaceItemType, oldScript: string) => {
  const {from, to} = item;
  const pattern = new RegExp(from, 'g');
  const newScript = oldScript.replace(pattern, to);
  const scriptName = `${item.domain}.js`;
  const scriptPath = path.join(OUTPUT_SCRIPT_PATH, scriptName);
  await writefile(scriptPath, newScript);

  const JSONItem = <ReplaceItemType> getJSONConfigItem(item.domain);
  JSONItem.target = scriptName;
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

const buildItemConfig = async (item: ConfigItemType) => {
  const oldScript = await fetchText(item.url);

  const options = [
    {action: 'replace', fct: replaceAction},
    {action: 'redirect', fct: redirectAction},
    {action: 'cancel', fct: () => {}},
  ];

  const selectedAction = options.find(({action}) => item.action === action);
  if (selectedAction) {
    try {
      // @ts-ignore
      await selectedAction.fct(item, oldScript);
    } catch (e) {
      throw new Error(`Invalid config for '${item.domain}', verify your configuration.\n${e}`);
    }
  } else {
    throw new Error(`Unknown action named '${item.action}' of '${item.domain}' script.`);
  }
};

// @MARK: Main
(async () => {
  try {
    verifyConfiguration(TYPED_CONFIG);
    const promises = TYPED_CONFIG.map(buildItemConfig);
    await Promise.all(promises);
    await saveConfiguration();
    console.log(`✅ '${path.basename(OUTPUT_CONFIG_PATH)}' file is now ready.`);
  } catch (e) {
    console.error(`[config.json] Error: ${e.message}`.red);
    process.exit(1);
  }
})();
