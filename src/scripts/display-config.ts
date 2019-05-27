import 'colors';
import * as commander from 'commander';
import * as nodeDiff from 'fast-diff';
import {readfile, slice} from 'src/utils';
import {ConfigItemType, RedirectItemType, ReplaceItemType, ConfigType, CancelItemType} from 'src/types';
import {assertValidConfiguration} from 'test/config-assert';

// @MARK: Constants
const MAX_PART_LENGTH = 25;

// @MARK: Log
const displaySlicedValue = (value: string) => {
  if (value.length <= MAX_PART_LENGTH) {
    process.stdout.write(value.white);
    return;
  }
  process.stdout.write(`${value.slice(0, MAX_PART_LENGTH/2)}[...]${value.slice(-MAX_PART_LENGTH/2)}`);
};

const displayDiff = (diff: nodeDiff.Diff[]) => diff.forEach(part => {
  const [state, value] = part;
  if (state === nodeDiff.INSERT) {
    process.stdout.write(`${value.green.bold}`);
  } else if (state === nodeDiff.DELETE) {
    process.stdout.write(`${value.red.bold}`);
  } else {
      displaySlicedValue(value);
  }
});

// @MARK: Actions Handlers
const redirectHandler = (item: RedirectItemType) => {
  console.log(`${slice(item.url).cyan.bold} to ${item.target.green.bold}`);
  process.stdout.write(' ↪️   ');
  displayDiff(item.diff);
  process.stdout.write('\n');
};

const replaceHandler = (item: ReplaceItemType) => (
  console.log(`${slice(item.url).blue.bold}`)
);

const cancelHandler = (item: CancelItemType) => (
  console.log(`${item.url.red.bold}`)
);

const displayConfigItem = (config: ConfigItemType) => {
  const ACTIONS = {
    redirect: redirectHandler,
    replace: replaceHandler,
    cancel: cancelHandler,
  };

  const handler = ACTIONS[config.action];
  process.stdout.write(`\n[${config.name.bold}]\t${config.action.toUpperCase().bold} `);
  // @ts-ignore
  handler(config);
};

// @MARK: File
const readConfiguration = async (configPath: string): Promise<ConfigType> => {
  const text = await readfile(configPath);
  const json = JSON.parse(text);
  assertValidConfiguration(json);
  return json;
};

// @MARK: Main
(async () => {
  let configPath: string;

  commander.arguments('<config_path>')
    .action(path => (configPath = path))
    .parse(process.argv);

  try {
    const config = await readConfiguration(configPath);
    config.forEach(displayConfigItem);
  } catch (e) {
    console.error(e.message.red);
  }
})();
