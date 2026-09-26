/* Root layout for everything under /cms: Payload's admin shell. Adapted from
   Payload's generated (payload)/layout.tsx; only the import paths differ
   because the admin lives at /cms instead of /admin. Served on the admin host
   only (src/proxy.ts). */
import config from '@payload-config';
import '@payloadcms/next/css';
import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import React from 'react';

import { importMap } from './cms/importMap.js';
import './custom.css';

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
