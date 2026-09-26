import * as migration_20260926_110249_init from './20260926_110249_init';

export const migrations = [
  {
    up: migration_20260926_110249_init.up,
    down: migration_20260926_110249_init.down,
    name: '20260926_110249_init'
  },
];
