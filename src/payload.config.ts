import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { CMS_BRAND } from './cms/branding';
import { Media } from './cms/collections/Media';
import { Users } from './cms/collections/Users';
import { mediaStoragePlugin } from './cms/media/storage';
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
    // Blueprint Code look: dark-only, brand mark, site fonts + palette via
    // the CSS variables in app/(cms)/custom.css.
    theme: CMS_BRAND.theme,
    meta: {
      titleSuffix: CMS_BRAND.titleSuffix,
      icons: [{ rel: 'icon', type: 'image/png', url: CMS_BRAND.iconSrc }],
    },
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'app/(cms)/cms/importMap.js'),
    },
    components: {
      beforeLogin: ['/cms/components/GoogleSignIn#GoogleSignIn'],
      actions: ['/cms/components/LogoutAction#LogoutAction'],
      graphics: {
        Logo: '/cms/components/Logo#Logo',
        Icon: '/cms/components/Icon#Icon',
      },
    },
  },
  collections: [Users, Media],
  plugins: [mediaStoragePlugin()],
  // Multipart limit for uploads that do pass through the server (client
  // uploads go straight to R2). Matches maxBytesFor() in media/keys.ts.
  upload: { limits: { fileSize: 200 * 1024 * 1024 } },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? '' },
    schemaName: CMS_DB_SCHEMA,
    // One workflow everywhere: schema changes are reviewed migration files
    // (npm run migrate:create <name>, then npm run migrate), applied on
    // deploy by prebuild and skipped once recorded. Dev-mode push is off so
    // the dev branch never drifts from what production will run.
    push: false,
    migrationDir: path.resolve(dirname, 'cms/migrations'),
  }),
  sharp,
});
