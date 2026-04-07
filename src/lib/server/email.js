import { render } from 'svelte-email';
import Mailjet from 'node-mailjet';
import ShowInfoRequest from '$lib/emails/ShowInfoRequest.svelte';

/**
 * Initialize Mailjet client
 */
function getMailjetClient() {
	const apiKey = process.env.MAILJET_API_KEY;
	const apiSecret = process.env.MAILJET_API_SECRET;

	if (!apiKey || !apiSecret) {
		throw new Error('Mailjet API credentials not configured');
	}

	return new Mailjet.Client({
		apiKey,
		apiSecret
	});
}

/**
 * Send show information request email
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.showName - Name of the show
 * @param {string} params.episodeTitle - Title of the episode
 * @param {string} params.episodeDate - Formatted date of the episode
 * @param {string} params.episodeId - UUID of the episode for verification
 * @param {string} params.baseUrl - Base URL of the site
 */
export async function sendShowInfoRequest({
	to,
	showName,
	episodeTitle,
	episodeDate,
	episodeId,
	baseUrl
}) {
	const formUrl = `${baseUrl}/submission?id=${episodeId}`;

	const emailHtml = render({
		template: ShowInfoRequest,
		props: {
			showName,
			episodeTitle,
			episodeDate,
			formUrl
		}
	});

	const mailjet = getMailjetClient();

	try {
		const response = await mailjet.post('send', { version: 'v3.1' }).request({
			Messages: [
				{
					From: {
						Email: process.env.MAILJET_FROM_EMAIL || 'noreply@radiodopo.it',
						Name: 'Radio Dopo'
					},
					To: [
						{
							Email: to
						}
					],
					Subject: `Episode Info Needed: ${showName} - ${episodeDate}`,
					HTMLPart: emailHtml
				}
			]
		});

		return { success: true, response };
	} catch (error) {
		console.error('Failed to send email:', error);
		throw new Error(`Email sending failed: ${error.message}`);
	}
}
