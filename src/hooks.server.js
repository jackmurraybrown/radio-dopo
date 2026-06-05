/**
 * SvelteKit server hooks
 * Handles scheduled cron jobs for Cloudflare Workers
 */

/**
 * Scheduled cron handler
 * Runs daily at 9:00 AM UTC to send episode info reminders
 */
export async function scheduled(event) {
	const { cron, waitUntil } = event;

	// Only run for the daily cron job
	if (cron === '0 9 * * *') {
		waitUntil(
			(async () => {
				try {
					console.log('Running daily episode reminder cron job');

					// Get the environment variables
					const cronSecret = event.env?.CRON_SECRET;
					const siteUrl = event.env?.PUBLIC_SITE_URL || 'https://radiodopo.it';

					// Call the API endpoint to send reminders
					const response = await fetch(`${siteUrl}/api/send-episode-reminders`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							...(cronSecret && { Authorization: `Bearer ${cronSecret}` })
						}
					});

					const result = await response.json();

					if (response.ok) {
						console.log(`Cron job completed. Sent ${result.emailsSent} emails.`);
					} else {
						console.error('Cron job failed:', result);
					}
				} catch (error) {
					console.error('Error in scheduled cron job:', error);
				}
			})()
		);
	}
}
