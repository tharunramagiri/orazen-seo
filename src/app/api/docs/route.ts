/**
 * GET /api/docs
 *
 * Scalar API Reference UI.
 * Reads the OpenAPI spec from /api/docs/openapi.json.
 */

import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  url: '/api/docs/openapi.json',
  pageTitle: 'Orazen SEO API Reference',
  theme: 'kepler',
  customCss: `
    .scalar-app { --scalar-color-1: #F0460E; }
  `,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)
