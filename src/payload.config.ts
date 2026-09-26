import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Users } from './cms/collections/Users';
import { CMS_COOKIE_PREFIX, CMS_DB_SCHEMA, CMS_ROUTES, cmsServerUrl } from './cms/settings';

/* Payload config. Mounted at /cms (+ /api/cms), which src/proxy.ts exposes on
   the admin host only. Runs against the existing Neon database but inside its
   own Postgres schema, so it never touches the public schema's `leads` table
   that the current /admin uses. */

const dirname = path.dirname(fileURLToPath(import.meta.url));

const serverURL = cmsServerUrl();

export default buildConfig({
  serverURL,
  routes: { ...CMS_ROUTES },
  graphQL: { disable: true },
  cookiePrefix: CMS_COOKIE_PREFIX,
  csrf: [serverURL],
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'app/(cms)/cms/importMap.js'),
    },
    components: {
      beforeLogin: ['/cms/components/GoogleSignIn#GoogleSignIn'],
    },
  },
  collections: [Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? '' },
    schemaName: CMS_DB_SCHEMA,
  }),
  sharp,
});
