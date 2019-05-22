import * as nodeDiff from 'fast-diff';
import * as assert from 'assert';
import * as path from 'path';

import {assertValidConfiguration} from './config-assert';
import {fetchText, readfile, chromePatternMatch} from 'src/utils';

import {RedirectItemType, ReplaceItemType, ConfigType} from 'src/types';

const BASE_PATH = path.join(__dirname, '..');
const SCRIPT_BASE_PATH = path.join(BASE_PATH, 'app/scripts');
const CONFIG_PATH = path.join(BASE_PATH, 'static/config.build.json');

type TestConfigType = {
  oldContent?: string,
  newContent?: string,
} & ReplaceItemType & RedirectItemType;

describe('#CONFIG', () => {
  let configs: TestConfigType[] = [];

  it('should read config', async () => {
    const fileContent = await readfile(CONFIG_PATH);
    const JSONConfig: ConfigType = JSON.parse(fileContent);
    const filteredConfigs = JSONConfig.filter(({action}) => (
      action === 'redirect' || action === 'replace'
    ));
    configs = <TestConfigType[]> filteredConfigs;
  });

  it('should have correct config file', () => {
    assertValidConfiguration(configs);
  });

  it('should get the initial script', async () => {
    const promises = configs.map(async config => {
      const {url} = config;
      const content = await fetchText(url);
      return {...config, oldContent: content};
    });
    configs = await Promise.all(promises);
  });

  it('should read the replaced script', async () => {
    const promises = configs.map(async config => {
      const scriptPath = path.join(SCRIPT_BASE_PATH, `${config.domain}.js`);
      const content = await readfile(scriptPath);
      return {...config, newContent: content};
    });
    configs = await Promise.all(promises);
  });

  it('should have unique domain', () => {
    const domains = configs.map(({domain}) => domain);
    const uniquesNames = new Set(domains);
    assert(domains.length === uniquesNames.size);
  });

  it('should have correct differences', () => {
    configs.forEach(config => {
      const diff = nodeDiff(config.oldContent, config.newContent);
      assert.deepEqual(diff, config.diff, `[${config.domain}] difference (diff) seems to be invalid.`);
    });
  });

  it('should have correct chrome pattern', () => {
    const domains = configs.map(({domain }) => domain);
    configs.forEach(({pattern, domain}) => configs.forEach(({domain: testedDomain, url: testedUrl}) => {
      if (testedDomain === domain) {
        assert(chromePatternMatch(testedUrl, pattern), `pattern '${pattern}' must match with url '${testedUrl}'.`);
      } else {
        assert(!chromePatternMatch(testedUrl, pattern), `pattern '${pattern}' mustn't match with url '${testedUrl}'.`);
      }
    }));
  });
});
