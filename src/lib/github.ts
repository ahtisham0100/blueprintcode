/* GitHub repo access for the admin demo tooling.

   Demos live in the site repository as public/<slug>/index.html and are served
   at /<slug> by the wildcard rewrite in next.config.ts. Adding or removing those
   files is what publishes or unpublishes a demo — Vercel redeploys on push. So
   "list the live demos" means reading the repo tree, and "delete a demo" means
   committing a removal.

   /api/deploy-demo (write) and /api/demos (list + delete) both resolve their
   repo, branch and auth through here so they can never disagree.

   Env:
     GITHUB_TOKEN   PAT (fine-grained, this repo, Contents read/write)
     GITHUB_REPO    "owner/repo"      (default: ahtisham0100/blueprintcode)
     GITHUB_BRANCH  branch to commit  (default: main)
*/

export interface RepoConfig {
  token: string;
  repo: string;
  branch: string;
}

/** Repo settings from the environment, or null when GITHUB_TOKEN is missing. */
export function repoConfig(): RepoConfig | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return {
    token,
    repo: process.env.GITHUB_REPO || 'ahtisham0100/blueprintcode',
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}

export function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'blueprintcode-admin',
  };
}

/** A non-2xx response from the GitHub API, carrying enough to report upstream. */
export class GitHubError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`GitHub request failed (${status}).`);
    this.name = 'GitHubError';
  }
}

async function gh<T>(cfg: RepoConfig, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${cfg.repo}${path}`, {
    ...init,
    headers: { ...ghHeaders(cfg.token), 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new GitHubError(res.status, (await res.text()).slice(0, 300));
  return (await res.json()) as T;
}

/* ---------------------------------------------------------------- listing -- */

/** Top-level public/ folders that hold site infrastructure, not demos. */
const NON_DEMO_DIRS = new Set(['assets', 'media', 'partials', 'capabilities']);

/** public/demos/ holds loose one-file demos served at /demos/<name>.html,
    rather than a folder per demo. They are listed as individual pages. */
const LOOSE_DEMO_DIR = 'demos';

export interface Demo {
  /** Stable identifier the admin UI sends back to delete: a slug, or "demos/<file>.html". */
  id: string;
  /** Public URL the demo is served at. */
  url: string;
  /** "page" = a public/<slug>/ folder; "file" = a single loose HTML file. */
  kind: 'page' | 'file';
  /** Blob paths in the repo that make up this demo — everything a delete removes. */
  paths: string[];
  /** Total size of those blobs, in bytes. */
  bytes: number;
}

export interface TreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  size?: number;
}

/** Every blob in the branch, one request. GitHub truncates enormous trees; this
    repo is nowhere near the limit, and a truncated read would only ever hide a
    demo from the list, never delete the wrong thing. */
async function fetchBlobs(cfg: RepoConfig): Promise<TreeEntry[]> {
  const tree = await gh<{ tree: TreeEntry[] }>(
    cfg,
    `/git/trees/${encodeURIComponent(cfg.branch)}?recursive=1`,
  );
  return tree.tree.filter((e) => e.type === 'blob');
}

/** Every demo currently published from the repo, alphabetically by id. */
export async function listDemos(cfg: RepoConfig): Promise<Demo[]> {
  return groupDemos(await fetchBlobs(cfg));
}

/** The demo-spotting rules, over a flat list of repo blobs. Split out from the
    fetch so it can be exercised against a tree from anywhere. */
export function groupDemos(blobs: TreeEntry[]): Demo[] {
  const folders = new Map<string, TreeEntry[]>();
  const loose: Demo[] = [];

  for (const blob of blobs) {
    if (!blob.path.startsWith('public/')) continue;
    const rest = blob.path.slice('public/'.length);
    const slash = rest.indexOf('/');
    if (slash === -1) continue; // public/robots.txt and friends — not a demo

    const top = rest.slice(0, slash);
    const tail = rest.slice(slash + 1);

    if (top === LOOSE_DEMO_DIR) {
      if (!tail.includes('/') && /\.html?$/i.test(tail)) {
        loose.push({
          id: `${LOOSE_DEMO_DIR}/${tail}`,
          url: `/${LOOSE_DEMO_DIR}/${tail}`,
          kind: 'file',
          paths: [blob.path],
          bytes: blob.size ?? 0,
        });
      }
      continue;
    }

    if (NON_DEMO_DIRS.has(top)) continue;
    const bucket = folders.get(top);
    if (bucket) bucket.push(blob);
    else folders.set(top, [blob]);
  }

  const pages: Demo[] = [];
  for (const [slug, blobsInFolder] of folders) {
    // Only a folder with its own index.html is actually reachable at /<slug>.
    if (!blobsInFolder.some((b) => b.path === `public/${slug}/index.html`)) continue;
    pages.push({
      id: slug,
      url: `/${slug}`,
      kind: 'page',
      paths: blobsInFolder.map((b) => b.path),
      bytes: blobsInFolder.reduce((sum, b) => sum + (b.size ?? 0), 0),
    });
  }

  return [...pages, ...loose].sort((a, b) => a.id.localeCompare(b.id));
}

/* --------------------------------------------------------------- deleting -- */

/** Remove every file of `demo` in one commit, so a multi-file demo (assets,
    extra pages) disappears whole rather than leaving a broken shell behind.
    Contents API deletes are per-file, so this goes through the Git Data API:
    build a tree from the current one with those paths dropped, commit it, and
    move the branch. Returns the new commit sha. */
export async function deleteDemo(cfg: RepoConfig, demo: Demo): Promise<string> {
  const ref = await gh<{ object: { sha: string } }>(
    cfg,
    `/git/ref/heads/${encodeURIComponent(cfg.branch)}`,
  );
  const parent = ref.object.sha;

  const head = await gh<{ tree: { sha: string } }>(cfg, `/git/commits/${parent}`);

  const tree = await gh<{ sha: string }>(cfg, '/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: head.tree.sha,
      // sha: null marks a path as deleted in the new tree.
      tree: demo.paths.map((path) => ({ path, mode: '100644', type: 'blob', sha: null })),
    }),
  });

  const commit = await gh<{ sha: string }>(cfg, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: `Remove demo: ${demo.id}`,
      tree: tree.sha,
      parents: [parent],
    }),
  });

  await gh(cfg, `/git/refs/heads/${cfg.branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}
