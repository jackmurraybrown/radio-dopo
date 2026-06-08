import { describe, it, expect, vi, beforeEach } from 'vitest';

const FAKE_ACCOUNT = {
	client_email: 'test@project.iam.gserviceaccount.com',
	// 100 'A' chars = valid base64; crypto.subtle.importKey is mocked so the value doesn't matter
	private_key: `-----BEGIN PRIVATE KEY-----\n${'A'.repeat(100)}\n-----END PRIVATE KEY-----\n`,
};

describe('getServiceAccountToken', () => {
	beforeEach(() => {
		vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_JSON', JSON.stringify(FAKE_ACCOUNT));

		// Mock Web Crypto API
		vi.stubGlobal('crypto', {
			subtle: {
				importKey: vi.fn().mockResolvedValue('mock-crypto-key'),
				sign: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
			},
		});

		// Mock token exchange
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ access_token: 'mock-access-token' }),
		}));
	});

	it('returns an access token', async () => {
		const { getServiceAccountToken } = await import('$lib/server/googleAuth.js');
		const token = await getServiceAccountToken();
		expect(token).toBe('mock-access-token');
	});

	it('sends a JWT bearer grant to the token endpoint', async () => {
		const { getServiceAccountToken } = await import('$lib/server/googleAuth.js');
		await getServiceAccountToken();

		expect(fetch).toHaveBeenCalledWith(
			'https://oauth2.googleapis.com/token',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('uses the provided scope', async () => {
		const { getServiceAccountToken } = await import('$lib/server/googleAuth.js');
		await getServiceAccountToken('https://www.googleapis.com/auth/drive.readonly');

		// The payload passed to sign should contain the custom scope
		const signCall = crypto.subtle.sign.mock.calls[0];
		const signingInput = new TextDecoder().decode(signCall[2]);
		const payloadB64 = signingInput.split('.')[1];
		const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
		expect(payload.scope).toBe('https://www.googleapis.com/auth/drive.readonly');
	});

	it('throws when Google auth fails', async () => {
		fetch.mockResolvedValueOnce({ ok: false, text: async () => 'invalid_grant' });
		const { getServiceAccountToken } = await import('$lib/server/googleAuth.js');
		await expect(getServiceAccountToken()).rejects.toThrow('Google auth failed');
	});
});
