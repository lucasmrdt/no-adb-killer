import {JSONBlacklistType, BlacklistType, BlacklistItemType} from '../types';

type BlacklistMapperOptionType = {
  onlyReplacementScript?: boolean,
};

export const blacklistMapper = (blacklist: JSONBlacklistType, options: BlacklistMapperOptionType = {}): BlacklistType => {
  let {items: json} = blacklist;
  if (options.onlyReplacementScript) {
    json = json.filter(item => item['new-script'] !== undefined);
  }
  return json.map<BlacklistItemType>(item => ({
    name: item.name,
    regexpPattern: new RegExp(item['regexp-pattern']),
    chromePattern: item['chrome-pattern'],
    oldScriptUrl: item['old-script-url'],
    pathRedirection: item['path-redirection'],
    diff: item.diff,
    replacement: (item.replacement
      ? {from: new RegExp(item.replacement.from), to: item.replacement.to}
      : undefined
    ),
  }));
};
