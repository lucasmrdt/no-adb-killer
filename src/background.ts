import * as blacklistJSON from './assets/blacklist.json';
import {blacklistMapper} from './utils/JSON';
import {BlacklistType, JSONBlacklistType} from './types';

const TYPED_BLACKLIST_JSON = <JSONBlacklistType> blacklistJSON;
const BLACKLIST: BlacklistType = blacklistMapper(TYPED_BLACKLIST_JSON);

const URLS: string[] = BLACKLIST.map(({chromePattern}) => chromePattern);

const getHandler = (request: chrome.webRequest.WebRequestBodyDetails): {cancel?: boolean, redirectUrl?: string} => {
  const {url} = request;
  const config = BLACKLIST.find(({regexpPattern}) => regexpPattern.test(url));
  if (config === null) {
    throw new Error(`Invalid catched url: "${url}", check the validity of your pattern.`);
  }
  if (config.pathRedirection) {
    return {redirectUrl: config.pathRedirection};
  }
  return {cancel: true};
};

chrome.webRequest.onBeforeRequest.addListener(
  getHandler,
  {urls: URLS},
  ['blocking'],
);

console.log('no-adb-killer is now active.');
