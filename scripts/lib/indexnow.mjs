/* IndexNow (Bing, Yandex, Seznam, Naver, Yep) — shared by the manual
 * script (scripts/indexnow.mjs) and the CMS publish hook. Google does not
 * support IndexNow; it relies on the sitemap's lastmod instead.
 * The key file public/<KEY>.txt proves ownership and must stay deployed. */

export const INDEXNOW_HOST = 'blueprintcode.ai';
export const INDEXNOW_KEY = 'cd7c8976e4324a2c930d37607d0f5c68';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Submit URLs. Resolves to { ok, status }. 200 and 202 are both accepted
 * (202 = key validation pending). Never throws on HTTP errors.
 * @param {string[]} urls absolute URLs on INDEXNOW_HOST
 * @param {typeof fetch} fetchFn
 */
export async function submitIndexNow(urls, fetchFn = fetch) {
  const urlList = [...new Set(urls)].filter((u) => u.startsWith(`https://${INDEXNOW_HOST}/`)).slice(0, 10000);
  if (!urlList.length) return { ok: true, status: 0, submitted: 0 };
  const res = await fetchFn(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });
  return { ok: res.status === 200 || res.status === 202, status: res.status, submitted: urlList.length };
}
