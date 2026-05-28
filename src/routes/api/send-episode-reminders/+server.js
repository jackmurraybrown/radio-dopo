import { json, error } from '@sveltejs/kit';
import { getEventsOnDay } from '$lib/server/googleCalendar.js';
import { sendShowInfoRequest } from '$lib/server/email.js';
import { format } from 'date-fns';
import { CRON_SECRET } from '$env/static/private';

// Send reminders 10, 4, and 3 days before the show
const REMINDER_DAYS = [10, 4, 3];

export async function POST({ request, url }) {
	const authHeader = request.headers.get('authorization');
	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		throw error(401, 'Unauthorized');
	}

	const baseUrl = url.origin;
	const results = [];
	const errors = [];

	for (const days of REMINDER_DAYS) {
		let events;
		try {
			events = await getEventsOnDay(days);
		} catch (err) {
			console.error(`[send-episode-reminders] Failed to fetch events for day +${days}:`, err);
			continue;
		}

		for (const event of events) {
			// Only send to non-organizer attendees with an email address
			const attendees = (event.attendees ?? []).filter((a) => !a.organizer && a.email);
			if (attendees.length === 0) continue;

			const startDate = event.start?.dateTime || event.start?.date;
			const localDate = startDate?.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
			const episodeDate = localDate ? format(new Date(localDate), 'MMMM d, yyyy HH:mm') : '';
			const showName = event.summary || 'Your Show';
			const formUrl = `${baseUrl}/submission?eventId=${event.id}`;

			for (const attendee of attendees) {
				try {
					await sendShowInfoRequest({ to: attendee.email, showName, episodeDate, formUrl });
					results.push({ eventId: event.id, showName, email: attendee.email, daysAhead: days });
				} catch (err) {
					console.error(`[send-episode-reminders] Failed to email ${attendee.email}:`, err);
					errors.push({ eventId: event.id, email: attendee.email, error: err.message });
				}
			}
		}
	}

	return json({
		success: true,
		emailsSent: results.length,
		results,
		...(errors.length ? { errors } : {}),
	});
}
