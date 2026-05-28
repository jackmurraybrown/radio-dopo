// Reads from process.env so tests can override via vi.stubEnv()
export const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '{}';
export const CRON_SECRET = process.env.CRON_SECRET ?? 'test-secret';
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? 'test-resend-key';
export const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN ?? 'test-directus-token';
export const DIRECTUS_WEBHOOK_SECRET = process.env.DIRECTUS_WEBHOOK_SECRET ?? '';
export const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID ?? '';
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? '';
