/* Ask Next to drop cached copies of public paths. Shared by the blog
   collections' hooks. Imported lazily: revalidatePath only exists inside the
   Next server; the Payload CLI (migrations, import scripts) loads the config
   too, and there it has nothing to invalidate. */

import type { RevalidateTarget } from './blog/revalidate';

export type Logger = { warn: (o: unknown) => void };

export type Revalidator = (targets: RevalidateTarget[]) => Promise<void>;

export const nextRevalidator: Revalidator = async (targets) => {
  const { revalidatePath } = await import('next/cache');
  for (const t of targets) {
    if (t.type) revalidatePath(t.path, t.type);
    else revalidatePath(t.path);
  }
};

/** Next throws this when revalidatePath runs outside a request (CLI scripts): nothing is cached there. */
export function isOutsideNextRequest(err: unknown): boolean {
  return /static generation store missing/i.test(String(err));
}

export async function revalidateTargets(targets: RevalidateTarget[], logger: Logger, revalidate: Revalidator = nextRevalidator): Promise<void> {
  if (!targets.length) return;
  try {
    await revalidate(targets);
  } catch (err) {
    if (isOutsideNextRequest(err)) return;
    logger.warn({ msg: 'cms: could not revalidate', targets, err: String(err) });
  }
}
