/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cloudflare Pages Functions entry point
 * Catches all /api/* requests on https://xuanthang.io.vn/api/*
 */

import { handleCloudflareApi, Env } from '../../server/cloudflare/router';

export interface PagesContext {
  request: Request;
  env: Env;
  params?: Record<string, string | string[]>;
  waitUntil?: (promise: Promise<any>) => void;
  next?: () => Promise<Response>;
  data?: Record<string, unknown>;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  return handleCloudflareApi(context.request, context.env);
};
