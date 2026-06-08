import { createDirectus, rest, staticToken } from '@directus/sdk';
import { DIRECTUS_TOKEN } from '$env/static/private';
import { DIRECTUS_URL } from '$lib/directus.js';

/**
 * Authenticated Directus client for server-side operations that require auth
 * (file uploads, writes, etc.)
 */
export const directusServer = createDirectus(DIRECTUS_URL)
	.with(staticToken(DIRECTUS_TOKEN))
	.with(rest());
