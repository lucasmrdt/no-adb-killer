import {Diff} from 'fast-diff';

export type ActionType = 'redirect' | 'cancel' | 'replace';

export type RawItemType = {
  action: ActionType,
  /**
   * @USER
   * Domain name of the website.
   * eg. `6play`
   */
  domain: string,
  /**
   * @USER
   * Chrome pattern looks like an url but you can ommit some id by `*`.
   * This prevent error when original script name is slightly updated.
   * eg. `https://www.6play.fr/player-fw-d18b7b5d33.bundle.js` can be written by
   *     `https://www.6play.fr/player-fw-*`.
   */
  pattern: string,
  /**
   * @AUTOMATIC ⛔️
   * `diff` allows to tests if the configuration still working.
   */
  diff?: Diff[],
};

/**
 * This option allows you to change only a small part of the
 * script at `url` by the `replacement` config.
 */
export type ReplaceItemType = {
  action: 'replace',
  /**
   * @USER
   * The `url` is the initial script.
   * eg. `https://www.6play.fr/player-fw-d18b7b5d33.bundle.js`
   */
  url: string,
  /**
   * @USER
   * RegExp pattern which would be replaced by the `to` string.
   * eg. `this\\.dispatchEvent\\((\\w+)\\.EVENT_REQUEST_COMPLETE,{success:!1}\\)`
   *
   * RexExp Tip: Groups allows you pattern to works with several version of build.
   * (babel rename some variables, so for example parameter `a` of function can be `i` in another build, be carefull)
   */
  from: string,
  /**
   * @USER
   * Replacement string.
   * eg. `this.dispatchEvent($1.EVENT_REQUEST_COMPLETE,{success:1})`
   *
   * RexExp Tip: `$1`, `$2`, ... allows you to inject group into your replacement.
   */
  to: string,
} & RawItemType;

/**
 * This option allows you to redirect the request which ask
 * the `url` to the `target`.
 */
export type RedirectItemType = {
  action: 'redirect',
  /**
   * @USER
   * The `url` is the initial script.
   * eg. `https://www.6play.fr/player-fw-d18b7b5d33.bundle.js`
   */
  url: string,
  /**
   * @USER
   * The name of the replacement script.
   * This script must be saved into `static/chrome/scripts`.
   * eg. `6play.js` if file `static/chrome/scripts/6play.js` exists.
   */
  target: string,
} & RawItemType;

export type CancelItemType = {
  action: 'cancel',
  /**
   * @USER
   * The `url` of the script which be canceled.
   * eg. `https://www.6play.fr/player-fw-d18b7b5d33.bundle.js`
   */
  url: string,
} & RawItemType;

export type ConfigItemType = ReplaceItemType | RedirectItemType | CancelItemType;

export type ConfigType = Array<ConfigItemType>;
