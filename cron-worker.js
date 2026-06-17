export default {
	async scheduled(event, env, ctx) {
		if (event.cron === '0 9 * * *') {
			ctx.waitUntil(sendReminders(env));
		} else if (event.cron === '0 * * * *') {
			ctx.waitUntil(checkNewShows(env));
		}
	},
};

async function sendReminders(env) {
	try {
		const res = await fetch(`${env.PUBLIC_SITE_URL}/api/send-episode-reminders`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
		});
		const body = await res.json();
		console.log('[cron] reminder result:', JSON.stringify(body));
	} catch (err) {
		console.error('[cron] reminder failed:', err);
	}
}

async function checkNewShows(env) {
	// Read persisted sync state from KV
	const stateRaw = await env.DOPO_KV.get('calendar_sync_state');
	const state = stateRaw ? JSON.parse(stateRaw) : {};

	let res;
	try {
		res = await fetch(`${env.PUBLIC_SITE_URL}/api/check-new-shows`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.CRON_SECRET}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				syncToken: state.syncToken ?? null,
				lastRunAt: state.lastRunAt ?? null,
				emailedAttendees: state.emailedAttendees ?? {},
			}),
		});
	} catch (err) {
		console.error('[cron] check-new-shows fetch failed:', err);
		return;
	}

	if (!res.ok) {
		console.error('[cron] check-new-shows failed:', res.status, await res.text());
		return;
	}

	const data = await res.json();
	console.log('[cron] check-new-shows result:', JSON.stringify(data));

	await env.DOPO_KV.put('calendar_sync_state', JSON.stringify({
		syncToken: data.nextSyncToken,
		lastRunAt: new Date().toISOString(),
		emailedAttendees: data.emailedAttendees ?? state.emailedAttendees ?? {},
	}));
}
