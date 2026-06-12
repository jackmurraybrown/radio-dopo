import { RESEND_API_KEY, DOPO_FROM_EMAIL } from '$env/static/private';

const from = DOPO_FROM_EMAIL || 'Radio Dopo <mail@mail.radiodopo.it>';

/**
 * Send a show email using a Resend template.
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.templateId
 * @param {string} params.name
 * @param {string} params.showDate - Combined "22 June at 18:00–19:00 (Europe/Palermo CET/CEST)"
 * @param {string} params.location
 * @param {string} params.repeats
 * @param {string} [params.formUrl]
 */
export async function sendShowEmail({ to, templateId, name, showDate, location, repeats, formUrl }) {
	const variables = { NAME: name, SHOW_DATE: showDate, LOCATION: location, REPEATS: repeats };
	if (formUrl) variables.FORM_URL = formUrl;

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
			variables,
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Email sending failed: ${res.status} ${body}`);
	}
}
