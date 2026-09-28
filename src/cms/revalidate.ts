/* Ask Next to drop cached copies of public paths. Shared by the blog
   collections' hooks. Imported lazily: revalidatePath only exists inside the
   Next server; the Payload CLI (migrations, scripts) loads the config too. */

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

export async function revalidateTargets(targets: RevalidateTarget[], logger: Logger, revalidate: Revalidator = nextRevalidator): Promise<void> {
  if (!targets.length) return;
  try {
    await revalidate(targets);
  } catch (err) {
    logger.warn({ msg: 'cms: could not revalidate', targets, err: String(err) });
  }
}
