import 'colors';
import * as crypto from 'crypto';
import * as prompts from 'prompts';
import * as nodeDiff from 'fast-diff';
import * as path from 'path';
import * as blacklistJSON from './assets/blacklist.json';
import {fetchText} from './utils/network';
import {readfile, writefile} from './utils/file';
import {blacklistMapper} from './utils/JSON';

import {
  BlacklistItemType,
  BlacklistType,
  JSONBlackListItemType,
  JSONBlacklistType,
} from './types';

const TYPED_BLACKLIST_JSON = <JSONBlacklistType> blacklistJSON;

const CHROME_SCRIPT_PATH = 'scripts';

const BASE_PATH = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(BASE_PATH, 'scripts');
const BLACKLIST_PATH = path.join(BASE_PATH, 'src/assets/blacklist.json');
const MAX_PART_LENGTH = 25;
const BLACKLIST: BlacklistType = blacklistMapper(TYPED_BLACKLIST_JSON);

// @MARK: Arguments:
const getArguments = (): string[] => {
  const {argv} = process;
  const currPath = __filename;
  for (let i = 0; i < argv.length; ++i) {
    if (argv[i] === currPath) {
      return argv.slice(i + 1);
    }
  }
  throw new Error(`Invalid argument provided to '${__filename}', it must be run as script not be included.`);
};

type ArgumentType = {
  force: boolean,
};

type ParserType = (argv: string[], output: ArgumentType) => [string[], ArgumentType];

const parseForceArgument: ParserType = (argv, output) => [
  argv.slice(1),
  {...output, force: true},
];

const parseArguments = (): ArgumentType => {
  let argv = getArguments();
  let output: ArgumentType = {
    force: false,
  };

  const parsers = {
    '--force': parseForceArgument,
    '-f': parseForceArgument,
  };

  while (argv.length !== 0) {
    const parser: ParserType = parsers[argv[0]];
    if (parser === undefined) {
      throw new Error(`Unhandled argument '${argv[0]}.'`);
    }
    [argv, output] = parser(argv, output);
  }

  return output;
};

// @MARK: Hash
const hasModifiedBlacklistFile = () => {
  const {hash: prevHash} = TYPED_BLACKLIST_JSON;
  const blacklistContent = JSON.stringify(TYPED_BLACKLIST_JSON.items);
  const newHash = crypto.createHash('sha256').update(blacklistContent).digest('hex');
  return prevHash !== newHash;
};

const setNewHash = () => {
  const blacklistContent = JSON.stringify(TYPED_BLACKLIST_JSON.items);
  const newHash = crypto.createHash('sha256').update(blacklistContent).digest('hex');
  TYPED_BLACKLIST_JSON['hash'] = newHash;
};

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

const displayDiff = (diff: nodeDiff.Diff[]) => {
  console.log('This is your modifications on the original script:'.bold);
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

// @MARK: Input
const getChoices = () => {
  return BLACKLIST.map<prompts.Choice>(item => ({
    title: path.basename(item.name),
    value: item.name,
  }));
};

const askSelectTarget = () => prompts({
  type: 'select',
  name: 'target',
  message: 'Which script did you update ?',
  choices: getChoices(),
});

// @MARK: Getters/Setters
const getBlacklistItem = (itemName: string): BlacklistItemType => {
  const index = BLACKLIST.findIndex(item => item.name === itemName);
  if (index === -1) {
    throw new Error(`File '${itemName}' unfound.`);
  }
  return BLACKLIST[index];
};

const getJSONBlackListItem = (itemName: string): JSONBlackListItemType => {
  const index = BLACKLIST.findIndex(item => item.name === itemName);
  if (index === -1) {
    throw new Error(`File '${itemName}' unfound.`);
  }
  return TYPED_BLACKLIST_JSON.items[index];
};

const saveBlacklist = async () => {
  setNewHash();
  return writefile(BLACKLIST_PATH, JSON.stringify(TYPED_BLACKLIST_JSON, null, 2));
};

// @MARK: Options Functions
const replacementOption = async (item: BlacklistItemType, oldScriptUrlContent: string) => {
  const {from, to} = item.replacement;
  const newScriptContent = oldScriptUrlContent.replace(from, to);
  const newScriptName = `${item.name}.js`;
  const newScriptPath = path.join(SCRIPT_PATH, newScriptName);
  await writefile(newScriptPath, newScriptContent);

  const newChromeScriptPath = path.join(CHROME_SCRIPT_PATH, newScriptName);
  const jsonBlackListItem = getJSONBlackListItem(item.name);
  jsonBlackListItem['path-redirection'] = newChromeScriptPath;
  jsonBlackListItem.diff = nodeDiff(oldScriptUrlContent, newScriptContent);
  displayDiff(jsonBlackListItem.diff);
};

const redirectionOption = async (item: BlacklistItemType, oldScriptUrlContent: string) => {
  const newScriptPath = path.join(BASE_PATH, item.pathRedirection);
  const newScriptContent = await readfile(newScriptPath);
  const jsonBlackListItem = getJSONBlackListItem(item.name);
  jsonBlackListItem.diff = nodeDiff(oldScriptUrlContent, newScriptContent);
  displayDiff(jsonBlackListItem.diff);
};

// @MARK: Main
(async () => {
  const argument = parseArguments();

  const isModified = hasModifiedBlacklistFile();
  if (!isModified && !argument.force) {
    console.log(`✅ There is no modification done on 'blacklist.json' file.`);
    return;
  }

  const {target} = await askSelectTarget();
  const blacklistItem = getBlacklistItem(target);
  const oldScriptContent = await fetchText(blacklistItem.oldScriptUrl);

  const options = [
    {key: 'replacement', fct: replacementOption},
    {key: 'redirection', fct: redirectionOption},
  ];

  const selectedOption = options.find(({key}) => blacklistItem[key] !== undefined);
  if (selectedOption) {
    await selectedOption.fct(blacklistItem, oldScriptContent);
  } else {
    console.log('@todo');
  }

  await saveBlacklist();
  console.log(`✅ 'blacklist.json' file is now updated.`);
})();
