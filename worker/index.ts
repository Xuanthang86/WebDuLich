/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cloudflare Worker standalone entry point
 * Deployed to https://api.xuanthang.io.vn
 */

import { handleCloudflareApi, Env } from '../server/cloudflare/router';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleCloudflareApi(request, env);
  },
};
