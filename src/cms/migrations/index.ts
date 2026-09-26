import * as migration_20260926_110249_init from './20260926_110249_init';
import * as migration_20260926_111418_add_media from './20260926_111418_add_media';

export const migrations = [
  {
    up: migration_20260926_110249_init.up,
    down: migration_20260926_110249_init.down,
    name: '20260926_110249_init',
  },
  {
    up: migration_20260926_111418_add_media.up,
    down: migration_20260926_111418_add_media.down,
    name: '20260926_111418_add_media'
  },
];
