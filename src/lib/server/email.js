import { render } from 'svelte-email';
import { Resend } from 'resend';
import ShowInfoRequest from '$lib/emails/ShowInfoRequest.svelte';

/**
 * Send show information request email
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.showName - Name of the show
 * @param {string} params.episodeDate - Formatted date of the episode
 * @param {string} params.formUrl - Full submission form URL
 */
export async function sendShowInfoRequest({ to, showName, episodeDate, formUrl }) {
	const resend = new Resend(process.env.RESEND_API_KEY);

	const html = render({
		template: ShowInfoRequest,
		props: { showName, episodeDate, formUrl }
	});

	const { error } = await resend.emails.send({
		from: process.env.DOPO_FROM_EMAIL || 'Radio Dopo <mail@mail.radiodopo.it>',
		to: [to],
		subject: `Episode Info Needed: ${showName} - ${episodeDate}`,
		html,
	});

	if (error) throw new Error(`Email sending failed: ${error.message}`);
}
