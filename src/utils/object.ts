export const withoutKeys = (keys: string[] | Set<string>, obj: object | any[]) => {
  const blacklistedKeys = keys instanceof Array ? new Set(keys) : keys;

  if (obj instanceof Array) {
    return obj.map(el => (el instanceof Object
      ? withoutKeys(blacklistedKeys, el)
      : el
    ));
  }

  return Object.keys(obj).reduce((finalObj, key) => {
    if (blacklistedKeys.has(key)) {
      return finalObj;
    }
    const value = (obj[key] instanceof Object
      ? withoutKeys(blacklistedKeys, obj[key])
      : obj[key]
    );
    return {...finalObj, [key]: value};
  }, {});
};