import fetch from 'node-fetch';

export const fetchText = async (url: string) => {
  const res = await fetch(url);
  return res.text();
};
