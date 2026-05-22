// Returns the episode airing at a given timestamp.
// Used to link recordings to episodes in the automated archiving process.

import { json } from '@sveltejs/kit';
import { getEpisodeByTime } from '$lib/queries/episodes.js';
import { env } from '$env/dynamic/private';

export async function GET({ url, request }) {
	const authHeader = request.headers.get('authorization');

	if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const t = url.searchParams.get('t');

	if (!t) {
		return json({ message: 'Missing required parameter: t' }, { status: 400 });
	}

	try {
		const episode = await getEpisodeByTime(decodeURIComponent(t));
		return json(episode);
	} catch (error) {
		console.error('[by-timestamp] Error:', error);
		return json({ message: error.message }, { status: 500 });
	}
}
