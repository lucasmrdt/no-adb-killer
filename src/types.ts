import {Diff} from 'fast-diff';

export type JSONBlackListItemType = {
  name: string,
  'regexp-pattern': string,
  'chrome-pattern': string,
  'old-script-url': string,
  'path-redirection'?: string,
  replacement?: {
    from: string,
    to: string,
  },
  diff?: Diff[],
};

export type BlacklistItemType = {
  name: string,
  regexpPattern: RegExp,
  chromePattern: string,
  oldScriptUrl: string,
  // If no newScript is provided, the matches 'oldScriptUrl' will juste be removed from website.
  pathRedirection?: string,
  replacement?: {
    from: RegExp,
    to: string,
  },
  diff?: Diff[],
};

export type JSONBlacklistType = {
  items: JSONBlackListItemType[]
  hash: string,
};
export type BlacklistType = BlacklistItemType[];
