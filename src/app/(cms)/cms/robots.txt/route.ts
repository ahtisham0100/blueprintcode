/* robots.txt for the admin host. proxy.ts rewrites admin.<domain>/robots.txt
   here; the public site keeps public/robots.txt. Nothing on the admin host is
   meant to be crawled, and there is no sitemap to point at. */

export function GET() {
  return new Response('User-agent: *\nDisallow: /\n', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
