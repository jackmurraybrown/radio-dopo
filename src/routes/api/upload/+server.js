import { error } from '@sveltejs/kit';
import { DIRECTUS_TOKEN } from '$env/static/private';
import { DIRECTUS_URL } from '$lib/directus.js';

const AUDIO_MAX_BYTES = 350 * 1024 * 1024; // 350MB

export async function POST({ request }) {
	const contentType = request.headers.get('content-type') || '';
	const contentLength = Number(request.headers.get('content-length') || 0);

	if (!contentType.includes('multipart/form-data')) {
		throw error(400, 'Expected multipart/form-data');
	}

	// Check size before reading body - reject obvious WAVs / oversized files
	const typeHeader = request.headers.get('x-file-type');
	if (typeHeader === 'audio' && contentLength > AUDIO_MAX_BYTES) {
		throw error(400, 'Audio file is too large. Please upload an MP3 (max 350MB).');
	}

	// Stream the body directly to Directus — no buffering
	const response = await fetch(`${DIRECTUS_URL}/files`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${DIRECTUS_TOKEN}`,
			'Content-Type': contentType,
		},
		// @ts-ignore — duplex required for streaming in some runtimes
		body: request.body,
		duplex: 'half',
	});

	if (!response.ok) {
		const text = await response.text();
		console.error('Directus upload error:', text);
		throw error(500, 'Failed to upload file. Please try again.');
	}

	const json = await response.json();
	return new Response(JSON.stringify({ id: json.data.id }), {
		headers: { 'content-type': 'application/json' },
	});
}
