import {ConfigItemType, ConfigType} from 'src/types';

// @MARK: Verify Configuration File
class ConfigErrors {
  static location = 'unknown';

  static notInSet = (key: string, invalidValue: string, validKeys: Set<string>) => {
    throw new Error(`${ConfigErrors.prefix} The value of '${key}'='${invalidValue}' must be one of theses '${[...validKeys].join(', ')}'`);
  }
  static invalidKey = (invalidKey: string, validKeys: Set<string>) => {
    throw new Error(`${ConfigErrors.prefix} The key '${invalidKey}' is invalid, only theses '${[...validKeys].join(', ')}' are valid.`);
  };
  static unfoundedKey = (unfounded: string) => {
    throw new Error(`${ConfigErrors.prefix} The key '${unfounded}' is unfounded but is required.`);
  };
  static invalidType = (key: string, type: string, validTypes: string | string[]) => {
    throw new Error(`${ConfigErrors.prefix} The key '${key}' has invalid type of '${type}', required ${validTypes instanceof Array ? validTypes.join(', ') : validTypes}.`);
  };

  static get prefix() {
    return `[config:${ConfigErrors.location}]`;
  }
};

const DEFAULT_VERIFIER = {
  action: new Set(['redirect', 'replace', 'cancel']),
  domain: String(),
  pattern: String(),
  'diff?': undefined,
};

const REPLACE_VERIFIER = {
  ...DEFAULT_VERIFIER,
  url: String(),
  from: String(),
  to: String(),
};

const REDIRECT_VERIFIER = {
  ...DEFAULT_VERIFIER,
  url: String(),
  target: String(),
};

const CANCEL_VERIFIER = {
  ...DEFAULT_VERIFIER,
  url: String(),
};

const VERIFIERS = {
  replace: REPLACE_VERIFIER,
  redirect: REDIRECT_VERIFIER,
  cancel: CANCEL_VERIFIER,
};

const assertValidKeys = (config: ConfigItemType, verifier: object) => {
  const validKeys = new Set(Object.keys(verifier));
  const keys = new Set(Object.keys(config));
  keys.forEach(key => {
    if (!validKeys.has(key) && !validKeys.has(`${key}?`)) {
      ConfigErrors.invalidKey(key, validKeys);
    }
  });
  validKeys.forEach(key => {
    const isOptionnalKey = key[key.length - 1] === '?';
    if (!keys.has(key) && !isOptionnalKey) {
      ConfigErrors.unfoundedKey(key);
    }
  });
};

const assertValidType = (config: ConfigItemType, verifier: object) => {
  Object.keys(verifier).forEach(key => {
    const configValue = config[key];
    const validValue = verifier[key];
    if (validValue instanceof Set) {
      if (!validValue.has(configValue)) {
        ConfigErrors.notInSet(key, configValue, validValue);
      }
    } else {
      if (validValue && typeof configValue !== typeof validValue) {
        ConfigErrors.invalidType(key, typeof configValue, typeof validValue);
      }
    }
  });
};

const assertValidActionKey = (config: ConfigItemType) => {
  if (!DEFAULT_VERIFIER.action.has(config.action)) {
    ConfigErrors.notInSet('action', config.action, DEFAULT_VERIFIER.action);
  }
};

export const assertValidConfiguration = (configs: ConfigType) => configs.forEach(config => {
  ConfigErrors.location = config.domain || 'unknown';
  assertValidActionKey(config);
  const verifier = VERIFIERS[config.action];
  assertValidKeys(config, verifier);
  assertValidType(config, verifier);
});
