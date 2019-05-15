const BLACKLIST = [
  {
    pattern: /https:\/\/static\.mytf1\.tf1\.fr\/assets\/js\/build\/blocks\/sections\/content\-video\-2\-html5\.js\?.*/,
    url: 'https://static.mytf1.tf1.fr/assets/js/build/blocks/sections/content-video-2-html5.js?*',
    replacedResponse: '',
  },
];

const URLS = BLACKLIST.map(({ url }) => url);

const getHandler = (url) => {
  item = BLACKLIST.find(({ pattern }) => pattern.test(url));
  if (item === null) {
    throw new Error(`Invalid catched url: "${url}", check the validity of your pattern.`);
  }
  return item.handler;
};

chrome.webRequest.onBeforeRequest.addListener(
  (req) => getHandler(req.url)(req),
  { urls: URLS },
  ['blocking'],
);

console.log('no-adb-killer is now active.');
