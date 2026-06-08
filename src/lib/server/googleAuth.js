import { GOOGLE_SERVICE_ACCOUNT_JSON } from '$env/static/private';

function base64url(str) {
	return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlFromBuffer(buffer) {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToDer(pem) {
	const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

/**
 * Get a Google API access token for the configured service account.
 * @param {string} scope - OAuth scope URL
 * @returns {Promise<string>}
 */
export async function getServiceAccountToken(scope = 'https://www.googleapis.com/auth/calendar.readonly') {
	const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);

	const now = Math.floor(Date.now() / 1000);
	const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const payload = base64url(JSON.stringify({
		iss: serviceAccount.client_email,
		scope,
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600,
	}));

	const signingInput = `${header}.${payload}`;

	const cryptoKey = await crypto.subtle.importKey(
		'pkcs8',
		pemToDer(serviceAccount.private_key),
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		cryptoKey,
		new TextEncoder().encode(signingInput)
	);

	const jwt = `${signingInput}.${base64urlFromBuffer(signature)}`;

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: jwt,
		}),
	});

	if (!res.ok) throw new Error(`Google auth failed: ${await res.text()}`);
	const { access_token } = await res.json();
	return access_token;
}
