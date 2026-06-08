import { RESEND_API_KEY, DOPO_FROM_EMAIL } from '$env/static/private';

const from = DOPO_FROM_EMAIL || 'Radio Dopo <mail@mail.radiodopo.it>';

/**
 * Send a show info request email using a Resend template.
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.templateId - Resend template ID
 * @param {string} params.name - Attendee / host name
 * @param {string} params.showDate - Formatted date and time of the episode
 * @param {string} params.formUrl - Full submission form URL
 */
export async function sendShowInfoRequest({ to, templateId, name, showDate, formUrl }) {
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${RESEND_API_KEY}`,
		},
		body: JSON.stringify({
			from,
			to: [to],
			template_id: templateId,
			variables: {
				NAME: name,
				SHOW_DATE: showDate,
				FORM_URL: formUrl,
			},
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Email sending failed: ${res.status} ${body}`);
	}
}
