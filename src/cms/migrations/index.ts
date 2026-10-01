import * as migration_20260926_110249_init from './20260926_110249_init';
import * as migration_20260926_111418_add_media from './20260926_111418_add_media';
import * as migration_20260926_115836_media_storage_fields from './20260926_115836_media_storage_fields';
import * as migration_20260928_040744_add_demos from './20260928_040744_add_demos';
import * as migration_20260928_083710_add_blog from './20260928_083710_add_blog';
import * as migration_20260930_120000_add_builder from './20260930_120000_add_builder';

export const migrations = [
  {
    up: migration_20260926_110249_init.up,
    down: migration_20260926_110249_init.down,
    name: '20260926_110249_init',
  },
  {
    up: migration_20260926_111418_add_media.up,
    down: migration_20260926_111418_add_media.down,
    name: '20260926_111418_add_media',
  },
  {
    up: migration_20260926_115836_media_storage_fields.up,
    down: migration_20260926_115836_media_storage_fields.down,
    name: '20260926_115836_media_storage_fields',
  },
  {
    up: migration_20260928_040744_add_demos.up,
    down: migration_20260928_040744_add_demos.down,
    name: '20260928_040744_add_demos',
  },
  {
    up: migration_20260928_083710_add_blog.up,
    down: migration_20260928_083710_add_blog.down,
    name: '20260928_083710_add_blog'
  },
  {
    up: migration_20260930_120000_add_builder.up,
    down: migration_20260930_120000_add_builder.down,
    name: '20260930_120000_add_builder',
  },
];
