import 'colors';
import {chromePatternMatch} from 'src/utils/string';

// @ts-ignore
import * as JSONConfig from 'dist/config.min.json';

import {ConfigType, RedirectItemType, ReplaceItemType, CancelItemType} from '../types';

const TYPED_CONFIG_JSON = <ConfigType> JSONConfig;
const URLS: string[] = TYPED_CONFIG_JSON.map(({pattern}) => pattern);

// @MARK: Handlers Functions
type ResponseType = {cancel?: boolean, redirectUrl?: string};

const replaceHandler = (url: string, config: ReplaceItemType): ResponseType => {
  const scriptPath = `scripts/${config.domain}.js`;
  console.log(`'${url.bold}' ▶️ '${scriptPath.bold}'`);
  return {redirectUrl: chrome.extension.getURL(scriptPath)};
};

const redirectHandler = (url: string, config: RedirectItemType): ResponseType => {
  const scriptPath = `scripts/${config.target}`;
  console.log(`'${url.bold}' ➡️ '${scriptPath.bold}'`);
  return {redirectUrl: chrome.extension.getURL(scriptPath)};
};

const cancelHandler = (url: string, _: CancelItemType): ResponseType => {
  console.log(`❌ '${url.bold}'`);
  return {cancel: true};
};

const HANDLERS = {
  replace: replaceHandler,
  redirect: redirectHandler,
  cancel: cancelHandler,
};

// @MARK: Chrome Main Entry Point
const getHandler = (request: chrome.webRequest.WebRequestBodyDetails): ResponseType => {
  const {url} = request;
  const config = TYPED_CONFIG_JSON.find(({pattern}) => chromePatternMatch(url, pattern));

  if (config === undefined) {
    throw new Error(`Invalid catched url '${url}', check the validity of your pattern.`);
  }

  const selectedHandler = HANDLERS[config.action];
  if (selectedHandler === undefined) {
    throw new Error(`Invalid action '${config.action}' for '${url}'.`);
  }

  // @ts-ignore
  return selectedHandler(url, config);
};

chrome.webRequest.onBeforeRequest.addListener(
  getHandler,
  {urls: URLS},
  ['blocking'],
);

console.log('no-adb-killer is now active.');
