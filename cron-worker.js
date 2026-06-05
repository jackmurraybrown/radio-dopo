export default {
	async scheduled(event, env, ctx) {
		ctx.waitUntil(
			fetch(`${env.SITE_URL}/api/send-episode-reminders`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${env.CRON_SECRET}`,
				},
			}).then(async (res) => {
				const body = await res.json();
				console.log('[cron] reminder result:', JSON.stringify(body));
			}).catch((err) => {
				console.error('[cron] reminder failed:', err);
			})
		);
	},
};
