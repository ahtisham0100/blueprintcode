/* Copy every object from one R2 bucket to another, server-side (no
 * download), skipping keys that already exist in the destination. Used to
 * mirror production media into the local dev bucket after a Neon branch
 * reset, so local records have their files.
 *
 *   node --env-file=.env.local scripts/r2-sync.mjs <source-bucket> <dest-bucket>
 *
 * Credentials: R2_SYNC_ACCESS_KEY_ID / R2_SYNC_SECRET_ACCESS_KEY (a token
 * that can read the source and write the destination), falling back to the
 * app's R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY. Never deletes anything.
 */

import { CopyObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const [source, dest] = process.argv.slice(2);
if (!source || !dest || source === dest) {
  console.error('Usage: node --env-file=.env.local scripts/r2-sync.mjs <source-bucket> <dest-bucket>');
  process.exit(1);
}
const env = process.env;
const accessKeyId = env.R2_SYNC_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
const secretAccessKey = env.R2_SYNC_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
if (!env.R2_ACCOUNT_ID || !accessKeyId || !secretAccessKey) {
  console.error('R2_ACCOUNT_ID and R2(_SYNC)_ACCESS_KEY_ID / _SECRET_ACCESS_KEY are required.');
  process.exit(1);
}

const client = new S3Client({
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

async function listAll(bucket) {
  const keys = new Map();
  let token;
  do {
    const out = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const o of out.Contents ?? []) keys.set(o.Key, o.Size ?? 0);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

const [srcKeys, destKeys] = await Promise.all([listAll(source), listAll(dest)]);
let copied = 0;
let skipped = 0;
for (const [key, size] of srcKeys) {
  if (destKeys.has(key)) {
    skipped++;
    continue;
  }
  await client.send(new CopyObjectCommand({ Bucket: dest, Key: key, CopySource: encodeURI(`${source}/${key}`) }));
  copied++;
  console.log(`copied  ${key} (${size} bytes)`);
}
console.log(`\n${source} → ${dest}: ${copied} copied, ${skipped} already present, ${srcKeys.size} total in source.`);
