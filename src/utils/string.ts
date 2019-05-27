export const chromePatternMatch = (str: string, pattern: string): boolean => {
  for (let i = 0, j = 0; i < str.length; ++i) {
    if (pattern[j] === '*') {
      continue;
    }
    if (str[i] === pattern[j]) {
      ++j;
    } else {
      return false;
    }
  }
  return true;
};

export const slice = (str: string, maxSize = 20) => (str.length > maxSize
  ? `${str.slice(0, maxSize/2)}[...]${str.slice(-maxSize/2)}`
  : str
);
