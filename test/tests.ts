import * as nodeDiff from 'fast-diff';
import * as assert from 'assert';
import * as path from 'path';

import * as blacklistJSON from '../src/assets/blacklist.json';
import {blacklistMapper} from '../src/utils/JSON';
import {readfile} from '../src/utils/file';
import {fetchText} from '../src/utils/network';

import {BlacklistItemType, BlacklistType, JSONBlacklistType} from '../src/types';

const BASE_PATH = path.join(__dirname, '..');

const TYPED_BLACKLIST_JSON = <JSONBlacklistType> blacklistJSON;
const BLACKLIST: BlacklistType = blacklistMapper(TYPED_BLACKLIST_JSON, {onlyReplacementScript: true});

type FileType = {
  oldContent?: string,
  newContent?: string,
} & BlacklistItemType;

describe('#script difference', () => {
  let files: FileType[] = BLACKLIST;

  it('should get initial script content', async () => {
    const promises = files.map(async file => {
      const {oldScriptUrl} = file;
      const content = await fetchText(oldScriptUrl);
      return {...file, oldContent: content};
    });
    files = await Promise.all(promises);
  });

  it('should read file content', async () => {
    const promises = files.map(async file => {
      const filePath = path.join(BASE_PATH, file.pathRedirection);
      const content = await readfile(filePath);
      return {...file, newContent: content};
    });
    files = await Promise.all(promises);
  });

  it('should have unique name', () => {
    const names = files.map(({name}) => name);
    const uniquesNames = new Set(names);
    assert(names.length === uniquesNames.size);
  });

  it('should have correct diff', () => {
    files.forEach(file => {
      const diff = nodeDiff(file.oldContent, file.newContent);
      assert.deepEqual(diff, file.diff);
    });
  });
});
